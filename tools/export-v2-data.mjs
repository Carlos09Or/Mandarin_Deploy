// Exports the legacy vocabulary (js/*.js globals) into the v2 app:
//   app/src/data/hsk1.json      words + units
//   app/public/hanzi/<char>.json stroke data for every HSK 1 character (offline Hanzi Writer)
// Run from the repo root: node tools/export-v2-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['data.js', 'learning-data.js', 'practice-data.js', 'character-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), ctx);
}
const { WORDS, LEARNING_META, PRACTICE_BLOCKS, CHAR_DETAILS, RADICAL_HINTS } = ctx.window;

// Spanish for Panama: ustedes, never vosotros.
const ES_FIXES = { 151: 'ustedes' };

const UNIT_ES = {
  1: ['Personas e identidad', 'Pronombres, familia y cómo decir quién es alguien.'],
  2: ['Preguntas y conversación', 'Esto y aquello, preguntar, saludar y las partículas de pregunta.'],
  3: ['Números y cantidades', 'Números, edad, clasificadores, dinero y cantidades.'],
  4: ['Construir oraciones', 'Negación, grado, adverbios, posesión, existencia y capacidad.'],
  5: ['Lugares y transporte', 'La casa, tiendas, la escuela, direcciones y cómo moverse.'],
  6: ['Tiempo y clima', 'Días, partes del día, fechas, la hora y el clima.'],
  7: ['Comida y compras', 'Comer, beber, comprar y las cosas de todos los días.'],
  8: ['Idioma y comunicación', 'Hablar, leer, escribir y entender.'],
  9: ['Acciones y rutinas', 'Verbos del día a día y lo que haces cada día.'],
  10: ['Describir personas y cosas', 'Adjetivos, sentimientos y cómo describir el mundo.'],
};

const words = WORDS.map((w) => {
  const m = LEARNING_META[String(w.n)];
  return {
    n: w.n,
    hanzi: w.hanzi,
    pinyin: w.pinyin,
    es: ES_FIXES[w.n] ?? w.es,
    en: m.en,
    note: m.explanation,
    example: m.example,
  };
});

const units = PRACTICE_BLOCKS.map((b) => ({
  id: b.id,
  title: UNIT_ES[b.id][0],
  description: UNIT_ES[b.id][1],
  titleEn: b.title,
  words: b.words,
}));

const chars = {};
for (const [ch, d] of Object.entries(CHAR_DETAILS)) {
  chars[ch] = { radical: d.radical ?? null, components: d.components ?? [], clue: d.clue ?? '' };
}

const outDir = path.join(root, 'app/src/data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'hsk1.json'),
  JSON.stringify({ words, units, chars, radicals: RADICAL_HINTS }, null, 1) + '\n',
);

// Stroke data, only for the characters the course uses.
const require = createRequire(path.join(root, 'app/package.json'));
const dataDir = path.dirname(require.resolve('hanzi-writer-data/package.json'));
const hanziDir = path.join(root, 'app/public/hanzi');
fs.mkdirSync(hanziDir, { recursive: true });
const unique = [...new Set(words.flatMap((w) => [...w.hanzi]))].filter((c) => /\p{Script=Han}/u.test(c));
const missing = [];
for (const c of unique) {
  const src = path.join(dataDir, `${c}.json`);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(hanziDir, `${c}.json`));
  else missing.push(c);
}
console.log(`${words.length} words, ${units.length} units, ${unique.length} characters`);
if (missing.length) console.log('No stroke data for:', missing.join(' '));
