# Pasos 7 a 22: los recortes que faltan (método con franja pintada)

Cada paso: **1)** corres el comando, que crea `seed-<id>.png`; **2)** adjuntas SOLO esa imagen; **3)** pegas el prompt; **4)** guardas el resultado como `hd-<id>.png`. Todo en `design/map-quality-brief/hires-crops-640/`.

Ya hechos: `r3c3`, `r3c2`, `r2c3`, `r2c2`, `r2c4`. Se saltan (mar puro, los agrando yo): `r3c4`, `r4c1`, `r4c4`.

**Importante:** haz los pasos EN ORDEN. El comando usa los recortes que ya terminaste; si saltas uno, la imagen sale con menos franjas pintadas.

**Águila:** en `r2c6` y `r3c6` el prompt ya borra el águila, igual que la rana. Se podrá poner de nuevo como figura pequeña por código.

---

## Paso 7: r1c3

```bash
python3 tools/make_seed.py r1c3
```

**Adjuntar:** solo [seed-r1c3.png](hires-crops-640/seed-r1c3.png)  ·  **Guardar como:** `hires-crops-640/hd-r1c3.png`

Franjas ya pintadas en esta imagen: BOTTOM (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: BOTTOM (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

KEEP the Panama City skyline and the Canal lock at the bottom edge exactly as they are, if they are in this image.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Mostly open sea: keep it calm. Near the coast, the water turns turquoise and shallow.
- Caribbean green on the small piece of land.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 8: r1c4

```bash
python3 tools/make_seed.py r1c4
```

**Adjuntar:** solo [seed-r1c4.png](hires-crops-640/seed-r1c4.png)  ·  **Guardar como:** `hires-crops-640/hd-r1c4.png`

Franjas ya pintadas en esta imagen: BOTTOM (35% of the height), LEFT (15% of the width).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: BOTTOM (35% of the height), LEFT (15% of the width). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

KEEP the stone fort and the Canal locks with the container ship exactly as they are (same size, same place, only sharper).

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Colon: lush Caribbean green, grey stone along the coast, hills with mist.
- The sea near the coast turns turquoise and shallow.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 9: r1c2

```bash
python3 tools/make_seed.py r1c2
```

**Adjuntar:** solo [seed-r1c2.png](hires-crops-640/seed-r1c2.png)  ·  **Guardar como:** `hires-crops-640/hd-r1c2.png`

Franjas ya pintadas en esta imagen: BOTTOM (35% of the height), RIGHT (15% of the width).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: BOTTOM (35% of the height), RIGHT (15% of the width). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Mostly open sea: keep it calm.
- The small islets on the left: turquoise shallows around them, a little mangrove green on their edges, a few palms as they are.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 10: r2c1

```bash
python3 tools/make_seed.py r2c1
```

**Adjuntar:** solo [seed-r2c1.png](hires-crops-640/seed-r2c1.png)  ·  **Guardar como:** `hires-crops-640/hd-r2c1.png`

Franjas ya pintadas en esta imagen: RIGHT (15% of the width).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: RIGHT (15% of the width). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Chiriqui (west): cool deep greens, mist on the high ground, the fields on the slopes painted as soft patchwork terraces, no new objects.
- Ngabe-Bugle (east): highland green hills.
- Keep the volcano, its cloud cap and the coffee branch exactly as they are.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 11: r1c1

```bash
python3 tools/make_seed.py r1c1
```

**Adjuntar:** solo [seed-r1c1.png](hires-crops-640/seed-r1c1.png)  ·  **Guardar como:** `hires-crops-640/hd-r1c1.png`

Franjas ya pintadas en esta imagen: RIGHT (15% of the width), BOTTOM (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: RIGHT (15% of the width), BOTTOM (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Bocas del Toro (islands in the north-west): turquoise shallows, mangrove edges, a few banana-green patches, nothing added.
- Chiriqui (south): cool deep greens.
- Keep the volcano and its cloud cap exactly as they are.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 12: r3c1

```bash
python3 tools/make_seed.py r3c1
```

**Adjuntar:** solo [seed-r3c1.png](hires-crops-640/seed-r3c1.png)  ·  **Guardar como:** `hires-crops-640/hd-r3c1.png`

Franjas ya pintadas en esta imagen: RIGHT (15% of the width), TOP (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: RIGHT (15% of the width), TOP (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Chiriqui (north): cool deep greens turning to golden green near the Pacific.
- Pale sand beaches along the Pacific shore, turquoise shallows in the gulf, the islets kept as they are.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 13: r4c2

```bash
python3 tools/make_seed.py r4c2
```

**Adjuntar:** solo [seed-r4c2.png](hires-crops-640/seed-r4c2.png)  ·  **Guardar como:** `hires-crops-640/hd-r4c2.png`

Franjas ya pintadas en esta imagen: TOP (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: TOP (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Mostly open sea: keep it calm.
- The lush island (Coiba): dark-green jungle ringed by a turquoise coral shallow, nothing added. The small islet next to it stays as it is.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 14: r4c3

```bash
python3 tools/make_seed.py r4c3
```

**Adjuntar:** solo [seed-r4c3.png](hires-crops-640/seed-r4c3.png)  ·  **Guardar como:** `hires-crops-640/hd-r4c3.png`

Franjas ya pintadas en esta imagen: TOP (35% of the height), LEFT (15% of the width).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: TOP (35% of the height), LEFT (15% of the width). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Los Santos and Herrera (the southern tip): warm ochre and dry golden savannah, the existing green crop fields kept with neat painted rows, pale sand beaches, a few scattered trees.
- The sea around it: turquoise shallows near the shore.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 15: r2c5

```bash
python3 tools/make_seed.py r2c5
```

**Adjuntar:** solo [seed-r2c5.png](hires-crops-640/seed-r2c5.png)  ·  **Guardar como:** `hires-crops-640/hd-r2c5.png`

Franjas ya pintadas en esta imagen: LEFT (15% of the width).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: LEFT (15% of the width). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Panama (east of the city) and the start of Darien: deeper emerald greens, mountains with soft mist.
- The coast on the Gulf of Panama: pale sand and turquoise shallows.
- Keep the mountains and the hills as they are.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 16: r1c5

```bash
python3 tools/make_seed.py r1c5
```

**Adjuntar:** solo [seed-r1c5.png](hires-crops-640/seed-r1c5.png)  ·  **Guardar como:** `hires-crops-640/hd-r1c5.png`

Franjas ya pintadas en esta imagen: LEFT (15% of the width), BOTTOM (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: LEFT (15% of the width), BOTTOM (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Guna Yala: tiny sandbars with palms in turquoise water, kept exactly where they are, nothing added.
- The north coast of Panama and Colon: Caribbean green hills.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 17: r3c5

```bash
python3 tools/make_seed.py r3c5
```

**Adjuntar:** solo [seed-r3c5.png](hires-crops-640/seed-r3c5.png)  ·  **Guardar como:** `hires-crops-640/hd-r3c5.png`

Franjas ya pintadas en esta imagen: TOP (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: TOP (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- The small islands (Pearl Islands): sandy islets with palms in turquoise shallows, nothing added.
- The Darien coast: deep emerald jungle, pale sand along the shore.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 18: r4c5

```bash
python3 tools/make_seed.py r4c5
```

**Adjuntar:** solo [seed-r4c5.png](hires-crops-640/seed-r4c5.png)  ·  **Guardar como:** `hires-crops-640/hd-r4c5.png`

Franjas ya pintadas en esta imagen: TOP (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: TOP (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Mostly open sea: keep it calm. Near the coast the water turns turquoise and shallow.
- The edge of the Darien coast: deep emerald jungle.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 19: r2c6

```bash
python3 tools/make_seed.py r2c6
```

**Adjuntar:** solo [seed-r2c6.png](hires-crops-640/seed-r2c6.png)  ·  **Guardar como:** `hires-crops-640/hd-r2c6.png`

Franjas ya pintadas en esta imagen: LEFT (15% of the width).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: LEFT (15% of the width). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

REMOVE the harpy eagle completely if any part of it is in this image. Paint natural dense jungle, the same foliage and the branch's surroundings in its place, as if the eagle had never been there. Do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Darien (north) and Embera-Wounaan: dense deep-emerald jungle, brown-green rivers, mist.
- Guna Yala sandbars along the north coast, as they are.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 20: r1c6

```bash
python3 tools/make_seed.py r1c6
```

**Adjuntar:** solo [seed-r1c6.png](hires-crops-640/seed-r1c6.png)  ·  **Guardar como:** `hires-crops-640/hd-r1c6.png`

Franjas ya pintadas en esta imagen: LEFT (15% of the width), BOTTOM (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: LEFT (15% of the width), BOTTOM (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Mostly open sea: keep it calm.
- The small islets with palms on the left (Guna Yala): turquoise shallows around them, nothing added.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 21: r3c6

```bash
python3 tools/make_seed.py r3c6
```

**Adjuntar:** solo [seed-r3c6.png](hires-crops-640/seed-r3c6.png)  ·  **Guardar como:** `hires-crops-640/hd-r3c6.png`

Franjas ya pintadas en esta imagen: LEFT (15% of the width), TOP (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: LEFT (15% of the width), TOP (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

REMOVE the harpy eagle completely if any part of it is in this image. Paint natural dense jungle, the same foliage and the branch's surroundings in its place, as if the eagle had never been there. Do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- Darien: dense deep-emerald jungle, the winding river kept as it is, mist over the canopy.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---

## Paso 22: r4c6

```bash
python3 tools/make_seed.py r4c6
```

**Adjuntar:** solo [seed-r4c6.png](hires-crops-640/seed-r4c6.png)  ·  **Guardar como:** `hires-crops-640/hd-r4c6.png`

Franjas ya pintadas en esta imagen: LEFT (15% of the width), TOP (35% of the height).

```
Attached is ONE square image from our illustrated map of Panama, which is only partly painted. The strip(s) along these edge(s) are ALREADY the FINAL high-resolution painting: LEFT (15% of the width), TOP (35% of the height). The rest of the image is the old low-detail version, which you must repaint.

KEEP the already painted strip(s) EXACTLY as they are, unchanged. Repaint everything else as a much higher resolution, more detailed version of the SAME picture, continuing the painted strip(s) seamlessly: same painting style, brush texture, colour balance, light, foam and the way the water and waves are rendered. The result must look like one single painting, with no visible line where a strip ends.

KEEP IDENTICAL in the part you repaint: the exact composition, the coastline, the shape and position of every island, tree, hill, river, cloud, building and wave line. A viewer overlaying your result on the attached image must see everything in the same place.

ADD DETAIL, do not redesign: sharper edges, individual tree canopies, painted texture on hills and fields, finer ripples and depth in the water, cleaner foam, crisp small objects. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, no repeated copy-paste patterns.

There is no frog in this image; do not add any animal.

REMOVE the thin white province border lines that run across the LAND. Paint the terrain naturally underneath them. KEEP the white foam along the coast and around islands.

TERRAIN CHARACTER (colour and texture only, do NOT add new objects or buildings):
- The southern tip of Darien: deep emerald jungle, pale sand beaches along the Pacific coast, turquoise shallows.
Keep most of the land calm and open: no crowding, no extra decoration.

HARD RULES: NO TEXT anywhere. Do not add a frame, vignette, border, watermark or new landmarks. Keep the colours and water tone at the other edges the same as in the attached image.

OUTPUT: one image, square, the largest size you can output, no text.
```

**Revisa:** que la(s) franja(s) pintada(s) quedaron igual, que no se ve una línea donde empieza lo nuevo, que lo que se mantiene sigue igual y que no hay letras.

---
