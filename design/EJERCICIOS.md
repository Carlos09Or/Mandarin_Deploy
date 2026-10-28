# Ejercicios: ideas, análisis y decisiones de interfaz

Documento vivo. Las capturas de referencia están en `design/references/ejercicios/`.

## Implementado (rama `v3/panama-journey`, sin commit)

Toda la interfaz de las lecciones usa ya el esqueleto fijo de la sección 0 (`app/src/lesson/Stage.tsx`).

| Ejercicio | Archivo | Notas |
|---|---|---|
| Recall (3 opciones a lo ancho) | `Choice.tsx` | Mantiene las 4 variantes de pregunta |
| Emparejar con líneas | `Match.tsx` | Arrastrar de punto a punto, o tocar un extremo y luego el otro |
| Escribir pinyin | `Pinyin.tsx` | Acepta marcas de tono, números (`wo3`), espacios y `v` por `ü`; "I don't know" revela la respuesta |
| Escribir el carácter | `Trace.tsx` | Guía por niveles: `full` (primera vez), `faint` (1 a 2 veces), `none` (3 o más) |
| Ordenar la oración | `Sentence.tsx` | Título = traducción; huecos punteados |
| Rueda de oración | `Cloze.tsx` | Un hueco con una palabra funcional (`是 不 有 在 很 也 都 吗 的 了`…) |
| Dibuja el tono | `Tone.tsx` | Versión A (elegir entre 4); la curva se dibuja en la pauta al elegir |

Decisiones tomadas al implementar: emparejar = líneas (la rueda de emparejar queda en pausa); el tono solo sale con
palabras de una sílaba; el personaje del feedback sigue siendo el actual hasta que esté el sumo.
Pendiente: dibujo libre del tono (variante B), pinyin sin pista en lecciones avanzadas, y el sumo en la hoja de feedback.

Estados: 💡 idea · 🔍 en debate · ✅ decidido · 🛠 en construcción

---

## 0. Lo primero: la interfaz (por decidir antes de construir nada)

Las 8 referencias ya comparten, sin que lo planeáramos, el mismo esqueleto. Propongo convertirlo en regla.

### El esqueleto fijo ("shell") 🔍

De arriba hacia abajo, igual en TODOS los ejercicios:

1. **Barra superior:** `✕` a la izquierda + barra de progreso jade. Nada más.
2. **Etiqueta del ejercicio:** letras pequeñas en mayúscula, gris cálido (`MATCH · ONE AT A TIME`, `BUILD A SENTENCE`…).
   Dice *qué tipo de ejercicio es*, para que el alumno sepa qué gesto esperar.
3. **Instrucción:** una frase corta en negrita grande (`Find the meaning.`, `Draw matching lines.`).
4. **Escenario:** la zona que cambia. Es lo único que cambia entre ejercicios.
5. **Pie:** botón de acción a lo ancho (`CHECK` / `CONTINUE`) con borde inferior sólido.
   Al responder, el pie se convierte en la hoja de feedback (verde o rojo) con el personaje.

Lo que cambia entre ejercicios es **el gesto** del escenario: tocar, girar la rueda, trazar líneas, escribir,
dibujar. El marco no se mueve, así el alumno nunca se pierde.

### Qué lo diferencia de Duolingo

| Duolingo | Nosotros |
|---|---|
| Cuadrícula 2×2 de tarjetas | Pocas opciones (3), a lo ancho, en la zona del pulgar |
| Mismo gesto casi siempre (tocar) | Un gesto distinto por habilidad (girar, trazar, dibujar, escribir) |
| Caracteres pequeños | El carácter es el protagonista y ocupa ~35% de la pantalla |
| Mascota decorativa | Personaje que reacciona, pero solo en la hoja de feedback |
| Sin tono como ejercicio | Tono como ejercicio normal, con color por tono |

### El nuevo personaje en los ejercicios (el sumo) 🔍

Los ejercicios hoy no tienen personaje. Propuesta: **no ponerlo en el escenario**, para no tapar el contenido.
Aparece solo en tres sitios: la hoja de feedback (pequeño, a la izquierda del mensaje), el inicio de lección
y la pantalla final. Poses: neutro, pensando, celebrando, ánimo, presentando, reverencia.
Nombre propuesto: 胖胖 Pàngpang.

### Decisiones abiertas de interfaz

- [ ] ¿Se mantiene el esqueleto fijo de 5 zonas (arriba)?
- [ ] ¿Opciones siempre a lo ancho (píldoras) o también en mosaico?
- [ ] ¿Feedback en hoja inferior (como ahora) o el fondo entero cambia de color?
- [ ] ¿El sumo vive solo en la hoja de feedback o también en la etiqueta de ejercicio?
- [ ] ¿Color por tono en todo el pinyin de la app?
- [ ] Texto de la interfaz en inglés (como hoy) o español: hoy las capturas están en inglés.

---

## 1. Análisis: ¿algún ejercicio repite la dinámica de otro?

Criterio: dos ejercicios se repiten si **el alumno hace el mismo gesto para entrenar la misma habilidad**.

| # | Ejercicio | Gesto | Habilidad | ¿Qué existe hoy? |
|---|---|---|---|---|
| E1 | Recall (un par) | Tocar 1 de 3 | Reconocer significado | **Ya existe**: `Choice.tsx` (`hanzi-en`) |
| E2 | Emparejar con rueda | Girar dos ruedas | Emparejar | `Match.tsx` (tocar pares) |
| E3 | Emparejar con líneas | Trazar líneas | Emparejar | `Match.tsx` (tocar pares) |
| E4 | Escribir pinyin | Teclear | Producir pronunciación | No existe |
| E5 | Escribir el carácter | Dibujar trazos | Producir hanzi | **Ya existe**: `Trace.tsx` |
| E6 | Ordenar la oración | Tocar fichas en orden | Orden de palabras | **Ya existe**: `Sentence.tsx` |
| E7 | Rueda de oración | Girar 1 rueda | Palabra funcional en contexto | No existe |
| E8 | Dibuja el tono | Elegir o dibujar curva | Tono (oído) | No existe |

### Repeticiones encontradas

1. **E1 Recall = el ejercicio `choice` actual.** Es el mismo gesto y la misma habilidad; solo cambia de cuadrícula 2×2
   a un par a la vez con 3 opciones. **No es un ejercicio nuevo: es un rediseño.** Además `choice` ya tiene 4 variantes
   (`hanzi-en`, `en-hanzi`, `audio-hanzi`, `hanzi-pinyin`), así que "escuchar y elegir" ya está cubierto sin otro ejercicio.
2. **E2 + E3 + el `Match` actual son tres versiones del mismo ejercicio** (emparejar). Hay que **elegir una**.
   - Recomendación: **E3 líneas**. Es rápida (5 pares en ~10 s), universal y se ve clara.
   - E2 (rueda) es original, pero girar dos ruedas por par es lento y repite el gesto de E7. Mejor guardar la rueda para E7.
3. **E5 con la silueta atrás = el `Trace` guiado actual.** Si el carácter se ve de fondo, ya no es "de memoria", es calcar.
   Lo que sí es nuevo es la **cuadrícula limpia con cruz y diagonales** y la **retirada gradual de la guía** (ver E5).
4. **E6 y E7 son la misma familia (construir oración).** Dinámicas distintas (ordenar todo vs. elegir una palabra),
   pero entrenan casi lo mismo. Se pueden quedar los dos si se reparten por dificultad (ver E7).

### Conjunto propuesto tras quitar repeticiones

| Gesto | Ejercicio | Qué entrena | Estado |
|---|---|---|---|
| Tocar | **Recall** (E1 rediseñado, con sus 4 variantes de pregunta) | Significado / audio / pinyin | 🔍 |
| Trazar líneas | **Emparejar con líneas** (E3, reemplaza a `Match`) | Vocabulario en bloque | 🔍 |
| Teclear | **Escribir pinyin** (E4) | Pronunciación | 🔍 |
| Dibujar trazos | **Escribir el carácter** (E5, fusiona con `Trace`) | Escritura | 🔍 |
| Ordenar fichas | **Ordenar la oración** (E6, ya existe) | Orden de palabras | 🔍 |
| Girar rueda | **Rueda de oración** (E7) | Palabra funcional | 🔍 |
| Dibujar curva | **Dibuja el tono** (E8) | Tono | 🔍 |

Siete ejercicios, siete gestos distintos. **E2 (emparejar con rueda) queda en pausa**, no descartado.

---

## 2. Fichas por ejercicio

### E1. Recall (un par a la vez) 🔍
`recall-un-par.png`
- **Qué es:** el carácter en grande, con pinyin, y 3 opciones de significado a lo ancho. Un par a la vez.
- **Cómo se juega:** tocar la opción correcta. La elegida se marca en jade antes de comprobar.
- **Nuevo vs. hoy:** `Choice.tsx` pasa de 4 opciones en 2×2 a 3 a lo ancho, con el carácter mucho más grande.
- **Variantes de pregunta (ya en el motor):** hanzi→significado, significado→hanzi, audio→hanzi, hanzi→pinyin.
- **Nota:** el texto "Pair 3 of 5 · Fewer choices, quicker recall" del mockup es una nota del diseñador, no va en la app.
- **Por decidir:** ¿pinyin visible siempre o solo después de responder, para que el oído pese más?

### E3. Emparejar con líneas 🔍
`emparejar-lineas.png`
- **Qué es:** columna de caracteres a la izquierda, significados a la derecha, con un punto en cada uno.
- **Cómo se juega:** arrastrar del punto de un carácter al punto de su significado; queda una línea jade.
  Un par bien hecho se queda fijo y se atenúa.
- **Reemplaza:** el `Match.tsx` actual (tocar un lado y luego el otro).
- **Detalles:** 5 pares; barajar ambas columnas; vibrar y volver el punto si falla.
- **Por decidir:** ¿también se puede tocar un punto y luego el otro (accesibilidad)? Recomendado que sí.

### E2. Emparejar con rueda ⏸ (en pausa)
`emparejar-rueda.png`
- **Qué es:** dos ruedas lado a lado (hanzi y significado); se giran hasta que el par queda alineado en el centro.
- **Por qué en pausa:** repite la habilidad de E3 y es más lenta; el gesto de rueda se aprovecha mejor en E7.
- **Si se retoma:** podría servir como variante "difícil" de emparejar en repasos.

### E4. Escribir pinyin 🔍
`pinyin-escribir.png`
- **Qué es:** el carácter grande con su significado debajo y un campo de texto para teclear el pinyin.
- **Cómo se juega:** teclear la pronunciación (`wo`). Cursor jade.
- **Nota del mockup:** dice "no tone required" (sin tono). Eso choca con la importancia del tono (E8).
- **Por decidir:**
  - ¿Aceptar sin tono (más fácil) o pedir número de tono (`wo3`)?
  - Propuesta: sin tono en las primeras unidades, y el tono lo entrena E8.
  - Mostrar un teclado propio en vez del del sistema (más control, evita autocorrector).

### E5. Escribir el carácter (cuadrícula + guía que se retira) 🔍
`escribir-memoria.png`
- **Qué es:** cuadrícula blanca con cruz y diagonales punteadas (como las hojas de caligrafía) donde se dibujan los trazos.
- **Cambio pedido:** poner **la silueta del carácter detrás**, así que ya no se llama "de memoria".
- **Cómo se juega:** con la silueta visible, calcar trazo a trazo en orden; el trazo bien hecho se pinta jade.
- **Repetición detectada:** esto es el `Trace` guiado actual (`guided: true`). No se duplica; **se fusiona** en un solo ejercicio.
- **Idea para fusionarlo:** la guía se retira por niveles, un solo ejercicio con tres intensidades:
  1. **Guía fuerte:** silueta oscura + siguiente trazo resaltado.
  2. **Guía suave:** silueta muy tenue, sin resaltar trazos.
  3. **Sin guía:** cuadrícula vacía (el "de memoria" de la captura).
- **Instrucción y etiqueta:** en nivel 1 y 2 `TRACE`; en nivel 3 `DRAW FROM MEMORY`. La etiqueta cuenta la verdad.
- **Por decidir:** ¿cuántas veces por lección y qué carácter (el primero de la palabra nueva, como hoy)?

### E6. Ordenar la oración 🔍
`oracion-ordenar.png`
- **Qué es:** se da la frase en español (`I am a student.`) y se arma en chino con fichas.
- **Cómo se juega:** tocar fichas del banco para llenar los huecos en orden; tocar una ficha colocada la devuelve.
- **Estado:** ya existe (`Sentence.tsx`); aquí solo cambia el diseño (huecos punteados, ficha activa en jade).
- **Por decidir:** ¿se queda para oraciones de 3 o más palabras y deja a E7 las oraciones cortas?

### E7. Rueda de oración (completar con selector) 🔍
`oracion-rueda.webp`
- **Qué es:** una oración grande con **un hueco**, y una rueda vertical de 3 opciones debajo (`不` / `是` / `有`).
- **Cómo se juega:** girar la rueda hasta dejar la palabra correcta en el centro; el hueco se rellena en vivo.
  Luego confirmar. Al acertar suena la oración completa. Abajo, la traducción en gris suave.
- **Por qué funciona:** ves la oración armada mientras eliges, y se enfoca en la palabra gramatical, no en memorizar fichas.
- **Relación con E6:** misma familia. Propuesta: E7 en unidades 1 a 3 (oraciones cortas, 1 hueco); E6 a partir de oraciones largas.
- **Datos:** cada palabra ya tiene oración de ejemplo con hanzi, pinyin y traducción. Faltan distractores gramaticalmente razonables.

### E8. Dibuja el tono 🔍
`tono-dibuja.webp`
- **Qué es:** se oye una sílaba y se marca su contorno de tono en una pauta de 5 niveles.
- **Cómo se juega:** elegir entre 4 botones de tono (versión simple) o dibujar la curva con el dedo (versión completa).
- **Los 4 tonos (valores de Chao):**

| Tono | Forma | Niveles | Color en el mockup |
|---|---|---|---|
| 1 | plano alto | 5 → 5 | rojo |
| 2 | sube | 3 → 5 | jade |
| 3 | baja y sube | 2 → 1 → 4 | azul |
| 4 | cae | 5 → 1 | amarillo |
| neutro | corto y suave | sin pauta fija | gris |

- **⚠ Error en el mockup:** muestra `mā` con una curva que sube. Eso es el tono 2 (`má`). `mā` es tono 1 y va plano arriba.
- **Variantes:** elegir (A), dibujar (B), mixto (C); pares mínimos `mā má mǎ mà`; color por tono en toda la app.
- **Datos:** el tono sale del pinyin con marcas de `hsk1.json`; los clips de audio por palabra ya existen.
  Falta decidir si hacen falta sílabas sueltas para los pares mínimos.

---

## 3. Ideas anteriores sin decidir 💡

- **Escenario único:** carácter solo, respuestas como píldoras abajo (ya incluido de hecho en el esqueleto propuesto).
- **Brújula:** el carácter al centro y 4 respuestas alrededor, se responde arrastrando.
- **Cartas de deslizar:** repaso rápido, derecha = lo sé, izquierda = otra vez.
- **Armar el carácter con piezas:** arrastrar radicales (`扌` + `戈` = `我`) a un marco con cuadrícula. Conecta con el reveal de la lección 1.
- **Modo escucha nocturno:** fondo oscuro, solo onda de audio y tres caracteres.
- **El tren como barra de progreso:** vía fina arriba con el tren avanzando por estaciones.
- **Mini diálogo:** una burbuja a la vez con un personaje.
- **Feedback sin barra:** todo el fondo cambia a verde suave al acertar.

---

## 4. Prompts para el agente de imágenes

Pegar en este orden en el mismo chat. Adjuntar de referencia: `design/references/characters-sheet.png`, el sumo aprobado
y las capturas de `design/references/ejercicios/`.

### 4.1 Hoja de sistema (esqueleto + componentes + estados)

```
Create a UI design system sheet for a mobile language-learning app (Mandarin for Spanish speakers), on a warm beige canvas #ebe3d8, laid out as a clean presentation board with small labels. Style: flat, minimal, rounded, friendly, tactile (buttons have a solid darker bottom edge). Typography: Nunito (rounded sans) for UI, Noto Sans SC for Chinese. Palette: paper #fbf7f0, card white #fffdf9, ink #2b2420, muted #8b7f75, line #ece2d4, jade #2f9e7e, jade-soft #dff3eb, red #e0453a, sky #3b8fd9, gold #f2b544. Use only the exact text I give; do not invent Chinese characters.

Show, in a tidy grid:
1) THE SHELL: one phone-width screen (9:19) divided by thin dashed guide lines into 5 labeled zones: top bar (✕ + jade progress bar), small uppercase gray eyebrow label, bold large instruction line, empty STAGE area, and a bottom full-width action button "CHECK".
2) COMPONENTS: eyebrow label "MATCH · ONE AT A TIME"; instruction "Find the meaning."; answer pill in 4 states (default, selected jade outline with jade-soft fill, correct solid jade, wrong soft red); matching dot (idle, active jade); wheel picker (3 rows, center row highlighted jade-soft, outer rows faded); dashed empty sentence slot and filled tile; text input with jade cursor; handwriting grid card with dashed cross and diagonals; tone staff panel with 5 dashed levels; primary button in enabled and disabled states.
3) FEEDBACK SHEETS: two bottom sheets, correct (jade-soft) and wrong (soft red), each with a small round sumo-mascot avatar at the left, a short bold title, a detail line, and a "CONTINUE" button.
Calm, airy, lots of whitespace. No decorative illustrations besides the small avatar.
```

### 4.2 Los 7 ejercicios con el mismo esqueleto

```
Using the exact shell and components from the design system sheet, produce 7 phone screens in one 4x2 presentation board (last cell for the legend), each a different exercise, all with the SAME 5-zone shell. Use only this text:
1 Recall: eyebrow "RECALL", title "Find the meaning.", big "我" with "wǒ", three full-width pills "I / me", "she / her", "older brother".
2 Lines: eyebrow "LINK THE PAIRS", title "Draw matching lines.", left column 我 你 他 她 我们, right column "I / me", "you", "he / him", "she / her", "we / us", dots on each, one jade line already drawn between 我 and "I / me".
3 Pinyin: eyebrow "TYPE IT", title "What is the pinyin?", big "我" with "I / me", input showing "wo" with cursor.
4 Write: eyebrow "TRACE", title "Write “I / me”.", handwriting grid with a faint ghost of 我 behind and one jade stroke drawn.
5 Order: eyebrow "BUILD A SENTENCE", title "I am a student.", three slots with 我 placed, tile bank 是 学生 有.
6 Wheel: eyebrow "COMPLETE THE SENTENCE", sentence "我 ___ 学生。" with wheel showing 不 / 是 / 有, 是 highlighted, small gray "Yo soy estudiante."
7 Tone: eyebrow "TONES", title "Draw what you hear.", speaker button, staff with a flat red line on level 5 labeled "mā", four tone buttons, tone 1 selected.
Identical top bar, label style, title style and bottom button on every screen; only the stage changes.
```

---

## 5. Notas de código

- `lib/lesson.ts` define `Exercise` con: `intro`, `choice`, `match`, `trace`, `sentence`. Los nuevos serían `pinyin`, `cloze` (rueda) y `tone`.
  `match` se rediseña (líneas), `trace` gana intensidad de guía, `choice` y `sentence` solo cambian de piel.
- `LessonPlayer.tsx` ya tiene la cola de errores, la hoja de feedback y el audio con voz fija por ejercicio.
  El esqueleto de la sección 0 debe salir de ahí, no duplicarse en cada ejercicio.
- Construir **un componente de esqueleto** primero (etiqueta, instrucción, escenario, pie) y luego cada escenario encima.
