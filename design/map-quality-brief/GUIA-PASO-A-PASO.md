> **Nota:** esta guía quedó parcialmente reemplazada. Los recortes ahora son de 640 px (carpeta `hires-crops-640`) y se hacen con un vecino de referencia; ver [PASOS-5-A-22.md](PASOS-5-A-22.md). Las tareas B a E siguen igual.

# Guía paso a paso: mapa nítido y vivo

Todo lo que tienes que hacer tú con el agente de imágenes, en orden. Cada tarea dice: **qué imagen adjuntar**, **qué prompt pegar**, **cómo guardar el resultado** y **qué hago yo cuando me lo pases**.

Los prompts largos que ya existen están en [PROMPTS.md](PROMPTS.md); aquí te digo qué bloque copiar. Los prompts nuevos están completos en esta guía.

## Orden recomendado (cambió un poco)

| # | Tarea | Quién | Depende de |
|---|-------|-------|------------|
| A | Mapa en alta resolución, sin bordes de provincia (8 recortes) | Tú + agente, luego yo | nada |
| B | Mosaicos + bordes y espuma en vector | Yo (código) | A |
| C | Casitas, gente, autos, fauna, monumentos | Tú + agente, luego yo | nada (puede ir en paralelo con A) |
| D | Mapa de noche real | Tú + agente, luego yo | A y C (la noche se pinta sobre el día final) |
| E | Sombras de nubes, destellos, paralaje | Yo (código) | nada, va al final |

**Decisión que te recomiendo:** salta la hoja de 4 variantes (prompt 1 de PROMPTS.md). La opción 1 ("misma vista, mucho más rica") es justo lo que hace la tarea A. Las opciones 3 y 4 (monumentos y vida) las cubre la tarea C como figuras sueltas, que además se pueden animar y encender de noche; si van pintadas dentro del mapa no se pueden. Así te ahorras una ronda con el agente.

## Antes de empezar: qué esperar del agente

- Casi ningún agente de imágenes entrega 3344 px de un golpe. Por eso la tarea A parte el mapa en **8 recortes cuadrados** de 1100 px con bastante solape, ya cortados en [hires-crops/](hires-crops/). Pídele a cada uno el tamaño más grande que pueda (2048 px o más). Con 2048 px por 1100 px de origen el mapa final queda cerca de 6000 px de ancho, que es lo que pide un teléfono 3x con el mapa ampliado a 175%.
- El agente puede mover un poco la costa. La máscara de niebla y las provincias se calculan sobre la costa actual, así que **yo comparo cada recorte contra el original superponiéndolo**. Si se desvía, te pido repetirlo.
- Guarda siempre el archivo **sin comprimir** (PNG) y con el nombre exacto que te indico, en `design/map-quality-brief/`.

---

## Tarea A. Mapa en alta resolución, sin bordes

Haz esto **8 veces**, una por recorte. El prompt es el mismo; solo cambia la imagen adjunta.

| Adjuntar | Guardar resultado como |
|----------|------------------------|
| `hires-crops/crop-r1c1.png` | `hires-crops/hd-r1c1.png` |
| `hires-crops/crop-r1c2.png` | `hires-crops/hd-r1c2.png` |
| `hires-crops/crop-r1c3.png` | `hires-crops/hd-r1c3.png` |
| `hires-crops/crop-r1c4.png` | `hires-crops/hd-r1c4.png` |
| `hires-crops/crop-r2c1.png` | `hires-crops/hd-r2c1.png` |
| `hires-crops/crop-r2c2.png` | `hires-crops/hd-r2c2.png` |
| `hires-crops/crop-r2c3.png` | `hires-crops/hd-r2c3.png` (casi todo mar; hazlo al final, o salta y uso el actual) |
| `hires-crops/crop-r2c4.png` | `hires-crops/hd-r2c4.png` |

Consejo: haz primero `crop-r2c2` (tiene la rana y mucha tierra). Si ese sale bien, los demás saldrán parecidos. Si no, ajustamos el prompt antes de gastar los otros 7.

```
Attached is one square crop of our illustrated map of Panama. Repaint it as a much higher resolution, much more detailed version of the SAME picture, at the largest size you can output (at least 2048 x 2048).

KEEP IDENTICAL: the exact composition, the coastline, the shape and position of every island, river, mountain, tree group, ship, cloud and animal, the colours and the soft light from the upper left. Same polished illustrated-map look: soft gradients, clean shapes, white foam outlines along the COASTS, warm saturated colours, soft rim highlights. A viewer overlaying your result on the attached crop must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture in the fields and hills, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns, every tiny object readable and intentional.

REMOVE the thin white province border lines that run across the LAND (the white zigzag lines between regions). Paint the terrain naturally underneath them, as if those lines were never there. KEEP the white foam along the coast and around islands.

HARD RULES: NO TEXT anywhere. Do not redesign or redraw our mascots (a golden frog with brown spots and a straw hat, a harpy eagle, a sloth, a toucan); if one appears in the crop it stays exactly as it is, only sharper. Do not add a frame, vignette, border, watermark or new landmarks. The crop edges must continue seamlessly into the neighbouring crops, so keep the colours and water tone at the four edges the same as in the attached crop.

OUTPUT: one image, square, at least 2048 x 2048, no text.
```

**Qué hago yo cuando me los pases:** los alineo con el original, reviso que la costa no se movió, mezclo los solapes sin costuras, uno el mapa de ~6600 px y lo corto en mosaicos por provincia.

**Qué revisas tú antes de pasármelos:** que no haya letras, que la rana, el águila y el barco sigan iguales, y que no queden líneas blancas dentro de la tierra.

---

## Tarea B. Mosaicos y vector (solo yo)

No necesitas hacer nada con el agente. Cuando termine A:

1. Corto el mapa en mosaicos y cargo solo los de la provincia visible (baja la memoria).
2. Dibujo los bordes de provincia en vector desde `map-provinces.json`, con animación al desbloquear.
3. Dibujo la espuma de costa en vector, siempre nítida y animable.

Si algún recorte de A trae todavía líneas blancas, el paso 2 se vería doble. Por eso la revisión de "sin líneas blancas" importa.

---

## Tarea C. Vida: casitas, gente, autos, fauna, monumentos

No dependen de A, así que puedes hacerlas mientras haces los recortes. Todas llevan adjunta `map-illustrated-clean-lo.png` como referencia de estilo. Copia el bloque de código de la sección indicada en [PROMPTS.md](PROMPTS.md).

Orden sugerido (primero lo que más se nota):

| Orden | Sección de PROMPTS.md | Adjuntar | Guardar como |
|-------|----------------------|----------|--------------|
| C1 | 4 (casitas, puertos, detalles) | `map-illustrated-clean-lo.png` | `village-kit.png` |
| C2 | 5a (viajero y pescador) | `map-illustrated-clean-lo.png` | `walkers-a.png` |
| C3 | 5b (mujer en pollera y agricultor) | `map-illustrated-clean-lo.png` | `walkers-b.png` |
| C4 | 5c (niño y vendedora) | `map-illustrated-clean-lo.png` | `walkers-c.png` |
| C5 | 6 (vehículos) | `map-illustrated-clean-lo.png` | `vehicles.png` |
| C6 | 3a (monumentos, parte 1) | `map-illustrated-clean-lo.png` | `landmarks-a.png` |
| C7 | 3b (monumentos, parte 2) | `map-illustrated-clean-lo.png` | `landmarks-b.png` |
| C8 | 7a (fauna de mar) | `map-illustrated-clean-lo.png` | `ambient-sea.png` |
| C9 | 7b (fauna de aire y tierra) | `map-illustrated-clean-lo.png` | `ambient-air-land.png` |
| C10 | 5d (gente haciendo cosas) | `map-illustrated-clean-lo.png` | `people-activities.png` |
| C11 | 7c (humo, fuego, destellos) | `map-illustrated-clean-lo.png` | `ambient-small-effects.png` |
| C12 | nueva, abajo (monumentos dormidos) | `landmarks-a.png` y luego `landmarks-b.png` | `landmarks-a-dormant.png`, `landmarks-b-dormant.png` |

Si una hoja sale con personajes distintos entre cuadros, el ciclo de caminar salta. En ese caso repítela antes de pasármela.

### C12. Monumentos dormidos (para que "despierten")

Hazla cuando ya tengas C6 y C7. Cada monumento aparece apagado y bajo la niebla; al desbloquear la provincia, el código pasa de la versión dormida a la de color, con animación.

```
Attached is a sheet of landmark illustrations in full colour. Redraw the SAME sheet with every landmark in its DORMANT state: as if the place were asleep, forgotten and waiting to be discovered.

KEEP IDENTICAL: the exact grid, the position, size and silhouette of every landmark, the camera angle and the soft outline around each one. Do not redesign anything.

CHANGE ONLY: colours and mood. Desaturate to soft grey-blue and pale sand, as if covered in a light mist; no warm light, no glowing windows, no bright flags, no confetti, no animals or people moving (keep objects, remove life). Keep the shapes readable.

HARD RULES: NO TEXT anywhere. Do not touch mascots.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), same grid and scale as the attached sheet, no grid lines, no labels, no text.
```

**Qué hago yo con C:** recorto cada objeto, reconstruyo el borde blanco parejo, calculo los caminos sobre el mapa, pongo a la gente a caminar con ciclo de 6 cuadros, los autos en las carreteras, la fauna en su provincia y los monumentos en su sitio.

---

## Tarea D. Mapa de noche real

Haz esto **después de A y C**, porque la noche se pinta sobre el día final y las casitas ya están colocadas. Hoy la noche es un filtro de brillo (`filter: brightness(0.6)` en `journey.css`); esto lo reemplaza.

Mismos 8 recortes, pero adjuntando los **resultados de A** (los `hd-*`), no los originales.

| Adjuntar | Guardar resultado como |
|----------|------------------------|
| `hires-crops/hd-r1c1.png` | `hires-crops/hd-night-r1c1.png` |
| (igual para los otros 7) | `hd-night-r1c2.png` … `hd-night-r2c4.png` |

```
Attached is one square crop of our illustrated map of Panama in daylight. Redraw the SAME picture as a calm NIGHT version, at the same size.

KEEP IDENTICAL: the exact composition, coastline, shape and position of every island, river, mountain, tree group, ship, building, cloud and animal. A viewer overlaying your result on the attached crop must see everything in the same place. Same polished illustrated-map style with soft gradients and soft rim highlights. Do not redesign anything.

CHANGE ONLY THE LIGHTING AND COLOUR to a warm-cool night (not scary, not pitch dark, the map must stay readable):
- cool moonlight from the upper left: blue-violet shadows, pale silver rim light on mountains and rocks
- the sea becomes deep navy and teal, with a soft moonlit shimmer; the foam stays pale
- land greens become deep teal-green with a moonlit edge, golden savannah becomes dark ochre
- every house, tower, church and building gets WARM GOLDEN LIT WINDOWS and small lit doors
- the Panama City skyline glows with many lit windows
- the Canal locks and the container ship have small warm lamps and red/green navigation lights
- ports and cranes have small lamps; villages and roads have scattered warm street lights
- small warm glows sit on the water where lights reflect (soft, not large)
- clouds become lilac-navy with a moonlit edge
- the mascots (frog, harpy eagle) keep their exact colours and shape, only lit softly by the moon

HARD RULES: NO TEXT anywhere. Do not redraw our mascots. Do not add a frame, vignette, watermark or new objects. The crop edges must continue seamlessly into neighbouring crops, so keep the sea tone at the four edges consistent across the whole set.

OUTPUT: one image, same size and aspect as the attached crop, at least 2048 x 2048, no text.
```

Los monumentos y la gente de la tarea C también necesitan versión de noche. Para eso usa el prompt de [night-brief/PROMPTS.md](../night-brief/PROMPTS.md), cambiando "lesson door in 3 states" por la hoja de monumentos o de caminantes (adjunta la hoja y pide misma disposición, misma escala). Dímelo cuando llegues ahí y te lo escribo adaptado.

**Qué hago yo:** lo mismo que en A (alinear, revisar costa, mezclar solapes, mosaicos) y cambio el interruptor de noche para elegir mosaico de noche en vez del filtro.

---

## Tarea E. Extras baratos (solo yo)

Sombras de nubes sobre el mapa, destellos en el agua y paralaje suave al mover. No necesita arte nuevo. Lo hago al final, cuando el mapa ya esté estable, porque se apoya en las capas definitivas.

---

## Lista de control

- [ ] A: 8 recortes `hd-*` guardados y revisados (sin texto, sin líneas blancas en tierra, mascotas intactas)
- [ ] C1 a C11: hojas guardadas con el nombre exacto
- [ ] C12: monumentos dormidos
- [ ] D: 8 recortes de noche
- [ ] Cada vez que termines un bloque, pásamelo y yo hago la parte de código
