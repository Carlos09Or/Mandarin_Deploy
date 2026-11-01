# Mapa con más calidad y vida: brief para el agente de imágenes

Cómo usar: cada bloque va con su imagen adjunta y su nombre de salida (igual que los briefs anteriores de `night-brief`). Todos los textos de los prompts están en inglés para la IA de imágenes; el texto de la app se pone siempre en código, nunca dentro de las imágenes.

Orden recomendado: **0** (investigación) → **1** (hoja de 4 mapas para elegir) → elegir → **2** (mapa final) → **3** (lugares emblemáticos por provincia) → **4** (casitas, para que haya dónde vivir y caminar) → **5** (gente) → **6** (autos) → **7** (fauna y ambiente).

## Por qué Clash of Clans se siente vivo (y qué copiamos)

1. **Todo es una escena con cámara inclinada (45°)**, no un mapa plano: los objetos tienen altura, volumen y sombra.
2. **Mucha densidad de detalle pequeño**: cada rincón tiene algo (cajas, faroles, sombrillas, personas). Nuestro mapa tiene mucho espacio vacío entre provincias.
3. **Los personajes son muy chicos, lentos y numerosos**. Se mueven por **caminos que existen en la imagen** (calles, aceras): no cruzan por encima de edificios.
4. **Cada muñeco tiene un ciclo de caminar de 6+ cuadros** que va a su propio ritmo (como 8 cuadros por segundo), separado de la velocidad con la que avanza por el mapa. Eso es lo que lo hace suave.
5. **Sombras suaves debajo de cada cosa** y luces que cambian (día/noche).
6. **Orden de profundidad**: el que está más abajo en la pantalla se dibuja encima.

**Qué nos falta hoy y por qué importa:** nuestro mapa casi no tiene caminos ni pueblos visibles, así que la gente no tendría dónde caminar. Por eso los prompts piden caminos claros, casitas y puertos; el código después pone a los muñecos a seguir esos caminos.

**Aviso importante sobre la opción "mapa inclinado" (Option 2 del prompt 1):** la niebla, las provincias y las insignias de la app están calculadas sobre la forma plana actual. Un mapa inclinado distinto obligaría a rehacerlas. Recomiendo elegir entre las opciones 1, 3 y 4, que conservan la vista actual; la 2 es para ver si vale la pena.

## Qué haré yo en código (no necesita imagen)

- Mover todo solo con `transform` (como ya hacen los barcos) para que no se ponga pesado.
- Ciclo de caminar a ~8 cuadros por segundo con `steps()`, independiente de la velocidad de avance (unos 6 a 14 px/s, constante, sin acelerar).
- Rutas siguiendo los caminos del mapa, con pausas, vueltas y velocidades distintas por persona.
- Reflejar sprites para las 4 direcciones (solo dibujamos 2).
- Sombra suave generada por código bajo cada figura; versión de noche con la misma lógica de luz que ya usa el mapa.
- Solo aparecen en provincias ya desbloqueadas, máximo ~40 sprites a la vez, se apagan fuera de pantalla y cuando la app está en segundo plano.
- Los barcos que ya existen se quedan; solo se ajusta su velocidad si hace falta.

---

## 0. Investigación por provincia (solo texto, sin imagen)

```
Act as a travel researcher and art director. Research the 10 provinces of Panama (Panama, Panama Oeste, Cocle, Herrera, Los Santos, Veraguas, Chiriqui, Bocas del Toro, Colon, Darien) and the 3 indigenous comarcas (Guna Yala, Ngabe-Bugle, Embera-Wounaan).

For EACH, return a table with: (1) the 4 to 6 most iconic VISUAL landmarks or landscapes that would read clearly as a tiny illustration on a map, (2) typical biome and colour palette, (3) a signature local activity or tradition that could be drawn as tiny people (clothes, tools, festival), (4) typical local animals or plants, (5) typical architecture or boats. Only real, verifiable things; say when you are unsure.

Start from this list and correct or extend it:

PROVINCE FACTS (use them; verify and add up to 3 more real, visual features per province if you can research; never invent places):

1. PANAMA (centre-north, Pacific end of the Canal): Panama City glass-tower skyline; Panama Canal Miraflores locks with a container ship; Casco Viejo (pastel colonial houses, cathedral bell tower); Panama Viejo (ruined stone tower of the first city, 1519); Biomuseo (colourful folded roofs); Pearl Islands (sandy palm islets, humpback whales Jul-Oct); Taboga island ("island of flowers"); Gatun Lake and Soberania rainforest. Palette: glass blue, pastel, terracotta roofs, lowland rainforest green.
2. PANAMA OESTE (west of the Canal): Bridge of the Americas (steel arch bridge over the Canal's Pacific mouth); Centennial cable-stayed bridge; Coronado and Gorgona beaches; Punta Chame sand spit with kitesurfers; Cerro Campana cloud forest (misty green hill). Palette: pale sand, Pacific blue, mist.
3. COCLE: El Valle de Anton (a small town sitting inside a green extinct-volcano crater, with mist); La India Dormida (a long ridge shaped like a sleeping woman); Sitio Conte (pre-Columbian gold discs and figures); Aguadulce salt flats (white and pink pans) and sugar cane; Penonomé colonial church; Farallon and Rio Hato beaches. Palette: crater green, salt white, gold.
4. HERRERA (Azuero peninsula, dry arc): Chitre white colonial cathedral; La Arena pottery (terracotta pots drying on wooden racks beside a kiln); Ocu sombrero pintado (straw hat with black and white pattern); Parita colonial church; golden dry savannah with cattle and sugar cane; El Agallito shore birds. Palette: ochre, terracotta, dry gold.
5. LOS SANTOS (Azuero peninsula, south): Las Tablas Carnaval (colourful floats, queens, white polleras); La Villa de Los Santos Corpus Christi (red and black devil-dance masks) and its white church; Guarare folklore (Mejorana festival, dancers in polleras, tamborito drums); Pedasi (surf, Isla Iguana wildlife islet); Playa Venao surf beach; cattle, rice fields, Cerro Hoya forest. Palette: carnival red/white/gold on ochre land, bright sea.
6. VERAGUAS (the only province with both coasts): Coiba Island national park (marine reserve: turtles, whales, scarlet macaws, coral); Santa Catalina surf beach; Santa Fe highlands (cool green hills, orchids, trout streams, coffee); San Francisco de la Montana colonial church; Santiago cattle country. Palette: deep teal sea, cool hills.
7. CHIRIQUI (far west): Volcan Baru, the highest peak (about 3,475 m, cap of cloud); Boquete coffee farms (red cherries, shade trees, drying patios), flowers, Cerro Punta vegetable and strawberry terraces in patchwork; resplendent quetzal (emerald-green bird with long tail); Caldera hot springs; Gulf of Chiriqui islets (Boca Brava); David city. Palette: cool greens, mist, patchwork fields.
8. BOCAS DEL TORO (Caribbean archipelago, northwest): Colon Island town, wooden Caribbean houses on stilts over turquoise water in candy colours; Starfish Beach (orange starfish in shallow clear water); Bastimentos marine park and mangroves; coral reefs; banana plantations and cacao pods; dolphins; Ngabe cayucos (dugout canoes). Palette: turquoise, candy-coloured houses.
9. COLON (Caribbean coast, Atlantic end of the Canal): Portobelo (Spanish stone forts with cannons facing the bay, church of the Black Christ); San Lorenzo fort on a cliff at the Chagres river mouth; Gatun and Agua Clara locks with container ships queuing; Colon port cranes and cruise ship; Isla Grande Afro-Caribbean beach; Congo culture (colourful rag costumes and painted faces). Palette: Spanish stone grey, Caribbean green, port steel.
10. DARIEN (east, jungle): Darien National Park (UNESCO), Cerro Pirre in cloud; Tuira river with Embera dugout canoes; Embera-Wounaan village of thatched stilt huts; Yaviza, where the Pan-American Highway simply ends at the jungle (the Darien Gap); Pacific beaches at Jaque; jaguar, tapir, harpy eagle. Palette: deep emerald, brown-green rivers, mist.
COMARCAS (indigenous territories, art only, not lesson units): GUNA YALA = hundreds of tiny palm-covered sandbars, thatched huts, cayucos with small sails and mola textile patterns (layered red/orange geometric appliqué); NGABE-BUGLE = highland hamlets, women in long colourful geometric dresses (nagua), small coffee plots; EMBERA-WOUNAAN = Darien rainforest villages and finely woven baskets.
NATIONAL MOTIFS you may use as small accents: the Holy Ghost orchid (national flower), pollera dress, sombrero pintado, mola, the painted "diablo rojo" bus, the Canal.

Then propose how to emphasise each province on one illustrated map: where each landmark sits inside its province, its relative size (hero landmark = large, others small), and which province needs the most help to look distinct from its neighbours. Answer in a clear table, no images.
```

## 1. Attach `map-illustrated-clean-lo.png`  →  save result as `map-options-sheet.png`

Es la hoja para decidir. Sale una sola imagen con 4 mapas pequeños; después elegimos uno y se hace el final con el prompt 2.

```
Attached is the current illustrated map of Panama. Our problem: it looks empty and flat, and lacks quality and character compared with a premium mobile game map.

Create ONE concept sheet with FOUR alternative versions of the whole map in a 2 x 2 grid, each clearly labelled only by the position in the grid (no text). All four keep the exact same coastline, island positions and province borders as the attached map, in 16:9.

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

OPTION 1 (top-left), "same view, much richer": the same top-down view, but with far more craft: richer terrain textures, rivers, lakes, forests with individual tree canopies, farmland patches, soft cast shadows, ambient occlusion in valleys, brighter coastal water with depth, white foam.
OPTION 2 (top-right), "tilted diorama": the same silhouette seen from an oblique 45-degree camera like a premium city-builder game: mountains with real height and shadow, cliffs, the Canal as a visible water channel with locks, coastlines with thickness, like a floating island diorama.
OPTION 3 (bottom-left), "landmarks as heroes": the same top-down view, with one LARGE, charming hero landmark drawn for each province (see the facts below), clearly bigger than anything else, so every province is recognisable at a glance.
OPTION 4 (bottom-right), "a living country": the same top-down view, with visible light-coloured roads (the Pan-American Highway running from Panama City west to the Costa Rica border and east to where it ends in Darien), small villages with tiny houses, ports with cranes, bridges, small docks and beaches with umbrellas, plus plenty of clear road space where tiny people and cars could be walking and driving later.

ALL FOUR options must also: give each province its own colour temperature and character (see facts), keep a gentle readable border between provinces, and keep sea and sky free of clutter in some areas, so boats and clouds can be added.

PROVINCE FACTS (use them; verify and add up to 3 more real, visual features per province if you can research; never invent places):

1. PANAMA (centre-north, Pacific end of the Canal): Panama City glass-tower skyline; Panama Canal Miraflores locks with a container ship; Casco Viejo (pastel colonial houses, cathedral bell tower); Panama Viejo (ruined stone tower of the first city, 1519); Biomuseo (colourful folded roofs); Pearl Islands (sandy palm islets, humpback whales Jul-Oct); Taboga island ("island of flowers"); Gatun Lake and Soberania rainforest. Palette: glass blue, pastel, terracotta roofs, lowland rainforest green.
2. PANAMA OESTE (west of the Canal): Bridge of the Americas (steel arch bridge over the Canal's Pacific mouth); Centennial cable-stayed bridge; Coronado and Gorgona beaches; Punta Chame sand spit with kitesurfers; Cerro Campana cloud forest (misty green hill). Palette: pale sand, Pacific blue, mist.
3. COCLE: El Valle de Anton (a small town sitting inside a green extinct-volcano crater, with mist); La India Dormida (a long ridge shaped like a sleeping woman); Sitio Conte (pre-Columbian gold discs and figures); Aguadulce salt flats (white and pink pans) and sugar cane; Penonomé colonial church; Farallon and Rio Hato beaches. Palette: crater green, salt white, gold.
4. HERRERA (Azuero peninsula, dry arc): Chitre white colonial cathedral; La Arena pottery (terracotta pots drying on wooden racks beside a kiln); Ocu sombrero pintado (straw hat with black and white pattern); Parita colonial church; golden dry savannah with cattle and sugar cane; El Agallito shore birds. Palette: ochre, terracotta, dry gold.
5. LOS SANTOS (Azuero peninsula, south): Las Tablas Carnaval (colourful floats, queens, white polleras); La Villa de Los Santos Corpus Christi (red and black devil-dance masks) and its white church; Guarare folklore (Mejorana festival, dancers in polleras, tamborito drums); Pedasi (surf, Isla Iguana wildlife islet); Playa Venao surf beach; cattle, rice fields, Cerro Hoya forest. Palette: carnival red/white/gold on ochre land, bright sea.
6. VERAGUAS (the only province with both coasts): Coiba Island national park (marine reserve: turtles, whales, scarlet macaws, coral); Santa Catalina surf beach; Santa Fe highlands (cool green hills, orchids, trout streams, coffee); San Francisco de la Montana colonial church; Santiago cattle country. Palette: deep teal sea, cool hills.
7. CHIRIQUI (far west): Volcan Baru, the highest peak (about 3,475 m, cap of cloud); Boquete coffee farms (red cherries, shade trees, drying patios), flowers, Cerro Punta vegetable and strawberry terraces in patchwork; resplendent quetzal (emerald-green bird with long tail); Caldera hot springs; Gulf of Chiriqui islets (Boca Brava); David city. Palette: cool greens, mist, patchwork fields.
8. BOCAS DEL TORO (Caribbean archipelago, northwest): Colon Island town, wooden Caribbean houses on stilts over turquoise water in candy colours; Starfish Beach (orange starfish in shallow clear water); Bastimentos marine park and mangroves; coral reefs; banana plantations and cacao pods; dolphins; Ngabe cayucos (dugout canoes). Palette: turquoise, candy-coloured houses.
9. COLON (Caribbean coast, Atlantic end of the Canal): Portobelo (Spanish stone forts with cannons facing the bay, church of the Black Christ); San Lorenzo fort on a cliff at the Chagres river mouth; Gatun and Agua Clara locks with container ships queuing; Colon port cranes and cruise ship; Isla Grande Afro-Caribbean beach; Congo culture (colourful rag costumes and painted faces). Palette: Spanish stone grey, Caribbean green, port steel.
10. DARIEN (east, jungle): Darien National Park (UNESCO), Cerro Pirre in cloud; Tuira river with Embera dugout canoes; Embera-Wounaan village of thatched stilt huts; Yaviza, where the Pan-American Highway simply ends at the jungle (the Darien Gap); Pacific beaches at Jaque; jaguar, tapir, harpy eagle. Palette: deep emerald, brown-green rivers, mist.
COMARCAS (indigenous territories, art only, not lesson units): GUNA YALA = hundreds of tiny palm-covered sandbars, thatched huts, cayucos with small sails and mola textile patterns (layered red/orange geometric appliqué); NGABE-BUGLE = highland hamlets, women in long colourful geometric dresses (nagua), small coffee plots; EMBERA-WOUNAAN = Darien rainforest villages and finely woven baskets.
NATIONAL MOTIFS you may use as small accents: the Holy Ghost orchid (national flower), pollera dress, sombrero pintado, mola, the painted "diablo rojo" bus, the Canal.

HARD RULES: NO TEXT anywhere (no letters, numbers, signs with writing, flags with writing). Do not redesign or redraw our mascots (a golden frog with brown spots and a straw hat, a harpy eagle, a sloth, a toucan); if they appear in the attached map they stay exactly as they are. Panama's coastline, island positions and province borders must stay exactly where they are in the attached map.

OUTPUT: one image, 2 x 2 grid, each cell the full map in 16:9, thin white gutters, no text, no labels.
```

## 2. Attach `map-options-sheet.png` (the chosen option) + `map-illustrated-clean.png`  →  save result as `map-v2-day.png`

Se usa solo cuando ya elegimos opción. Cambiar `OPTION N` por la elegida.

```
Attached are (1) the concept sheet, from which I choose OPTION N, and (2) the current full-resolution map.
Paint the FINAL, full-resolution version (3344 x 1882, 16:9) of OPTION N, as a single clean map.

Keep the exact coastline, island positions and province borders of the current map (they are used for code masks). Do not draw anything over the borders that would hide them.
Make it feel premium: consistent soft light from the upper left, soft shadows, rich yet tidy detail, every tiny object readable and intentional, with no AI artifacts, no melted shapes, no repeated copy-paste patterns.
Keep clear road space and open water for animated sprites. Keep one calm place near the sea for the Canal-bound container ship that already exists in the picture, if it is there.

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

PROVINCE FACTS (use them; verify and add up to 3 more real, visual features per province if you can research; never invent places):

1. PANAMA (centre-north, Pacific end of the Canal): Panama City glass-tower skyline; Panama Canal Miraflores locks with a container ship; Casco Viejo (pastel colonial houses, cathedral bell tower); Panama Viejo (ruined stone tower of the first city, 1519); Biomuseo (colourful folded roofs); Pearl Islands (sandy palm islets, humpback whales Jul-Oct); Taboga island ("island of flowers"); Gatun Lake and Soberania rainforest. Palette: glass blue, pastel, terracotta roofs, lowland rainforest green.
2. PANAMA OESTE (west of the Canal): Bridge of the Americas (steel arch bridge over the Canal's Pacific mouth); Centennial cable-stayed bridge; Coronado and Gorgona beaches; Punta Chame sand spit with kitesurfers; Cerro Campana cloud forest (misty green hill). Palette: pale sand, Pacific blue, mist.
3. COCLE: El Valle de Anton (a small town sitting inside a green extinct-volcano crater, with mist); La India Dormida (a long ridge shaped like a sleeping woman); Sitio Conte (pre-Columbian gold discs and figures); Aguadulce salt flats (white and pink pans) and sugar cane; Penonomé colonial church; Farallon and Rio Hato beaches. Palette: crater green, salt white, gold.
4. HERRERA (Azuero peninsula, dry arc): Chitre white colonial cathedral; La Arena pottery (terracotta pots drying on wooden racks beside a kiln); Ocu sombrero pintado (straw hat with black and white pattern); Parita colonial church; golden dry savannah with cattle and sugar cane; El Agallito shore birds. Palette: ochre, terracotta, dry gold.
5. LOS SANTOS (Azuero peninsula, south): Las Tablas Carnaval (colourful floats, queens, white polleras); La Villa de Los Santos Corpus Christi (red and black devil-dance masks) and its white church; Guarare folklore (Mejorana festival, dancers in polleras, tamborito drums); Pedasi (surf, Isla Iguana wildlife islet); Playa Venao surf beach; cattle, rice fields, Cerro Hoya forest. Palette: carnival red/white/gold on ochre land, bright sea.
6. VERAGUAS (the only province with both coasts): Coiba Island national park (marine reserve: turtles, whales, scarlet macaws, coral); Santa Catalina surf beach; Santa Fe highlands (cool green hills, orchids, trout streams, coffee); San Francisco de la Montana colonial church; Santiago cattle country. Palette: deep teal sea, cool hills.
7. CHIRIQUI (far west): Volcan Baru, the highest peak (about 3,475 m, cap of cloud); Boquete coffee farms (red cherries, shade trees, drying patios), flowers, Cerro Punta vegetable and strawberry terraces in patchwork; resplendent quetzal (emerald-green bird with long tail); Caldera hot springs; Gulf of Chiriqui islets (Boca Brava); David city. Palette: cool greens, mist, patchwork fields.
8. BOCAS DEL TORO (Caribbean archipelago, northwest): Colon Island town, wooden Caribbean houses on stilts over turquoise water in candy colours; Starfish Beach (orange starfish in shallow clear water); Bastimentos marine park and mangroves; coral reefs; banana plantations and cacao pods; dolphins; Ngabe cayucos (dugout canoes). Palette: turquoise, candy-coloured houses.
9. COLON (Caribbean coast, Atlantic end of the Canal): Portobelo (Spanish stone forts with cannons facing the bay, church of the Black Christ); San Lorenzo fort on a cliff at the Chagres river mouth; Gatun and Agua Clara locks with container ships queuing; Colon port cranes and cruise ship; Isla Grande Afro-Caribbean beach; Congo culture (colourful rag costumes and painted faces). Palette: Spanish stone grey, Caribbean green, port steel.
10. DARIEN (east, jungle): Darien National Park (UNESCO), Cerro Pirre in cloud; Tuira river with Embera dugout canoes; Embera-Wounaan village of thatched stilt huts; Yaviza, where the Pan-American Highway simply ends at the jungle (the Darien Gap); Pacific beaches at Jaque; jaguar, tapir, harpy eagle. Palette: deep emerald, brown-green rivers, mist.
COMARCAS (indigenous territories, art only, not lesson units): GUNA YALA = hundreds of tiny palm-covered sandbars, thatched huts, cayucos with small sails and mola textile patterns (layered red/orange geometric appliqué); NGABE-BUGLE = highland hamlets, women in long colourful geometric dresses (nagua), small coffee plots; EMBERA-WOUNAAN = Darien rainforest villages and finely woven baskets.
NATIONAL MOTIFS you may use as small accents: the Holy Ghost orchid (national flower), pollera dress, sombrero pintado, mola, the painted "diablo rojo" bus, the Canal.

HARD RULES: NO TEXT anywhere (no letters, numbers, signs with writing, flags with writing). Do not redesign or redraw our mascots (a golden frog with brown spots and a straw hat, a harpy eagle, a sloth, a toucan); if they appear in the attached map they stay exactly as they are. Panama's coastline, island positions and province borders must stay exactly where they are in the attached map.

OUTPUT: one image, 3344 x 1882, no text, no borders, no watermark.
```

## 3a. Attach `map-illustrated-clean-lo.png` (style reference)  →  save result as `landmarks-a.png`

```
Attached is our illustrated map of Panama; use it as style reference. Draw a SHEET of separate landmark illustrations for a living map, each one an independent object that I can cut out and place on the map.

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

Draw these landmarks, each as ONE separate object with a little of its own ground (a small patch of land, sand or water) and a soft white outline around the whole object, in the same oblique bird's-eye 45-degree view and the same light from the upper left:
1. Panama City skyline: five or six glass towers, one with a twisting shape.
2. Casco Viejo: pastel colonial houses around a cathedral with a bell tower.
3. Panama Viejo: ruined stone tower and wall remains.
4. Biomuseo: colourful folded metal roofs.
5. Pearl Islands: three tiny sandy palm islets with turquoise water around them.
6. Bridge of the Americas: a steel arch bridge over a short water channel with a small ship.
7. Cerro Campana: a misty green hill with cloud forest and a trail.
8. Punta Chame: a sand spit with two tiny kitesurf kites.
9. El Valle de Anton: a small town with red roofs inside a green volcano crater, light mist.
10. La India Dormida: a long ridge shaped like a sleeping woman.
11. Sitio Conte: an archaeological pit with golden discs and figures.
12. Aguadulce salt flats: white and pink salt pans with small mounds.
13. Chitre cathedral: white colonial church with a bell tower.
14. La Arena pottery: terracotta pots drying on wooden racks beside a small kiln.
15. Ocu hat workshop: a thatched house with straw hats (black and white pattern) hanging on a line.
16. Las Tablas Carnaval: a small colourful float with a queen in a white dress and confetti, no text.
17. La Villa de Los Santos white church with two red-and-black devil-dance masks beside it.
18. Pedasi: a surfer beach with a small islet (Isla Iguana) and two surfboards in the sand.

Each landmark is charming and recognisable at a small size, about 300 px wide each in the sheet, with clean silhouettes, no text or signs with writing. Leave generous white space between them so they can be cut out.
NO ground shadow outside each object's own patch, no glow, no floor spreading.

HARD RULES: NO TEXT anywhere (no letters, numbers, signs with writing, flags with writing). Do not redesign or redraw our mascots (a golden frog with brown spots and a straw hat, a harpy eagle, a sloth, a toucan); if they appear in the attached map they stay exactly as they are. Panama's coastline, island positions and province borders must stay exactly where they are in the attached map.

OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), objects in an even grid (4 columns), no grid lines, no labels, no text.
```

## 3b. Attach `map-illustrated-clean-lo.png` (style reference)  →  save result as `landmarks-b.png`

```
Attached is our illustrated map of Panama; use it as style reference. Draw a SHEET of separate landmark illustrations for a living map, each one an independent object that I can cut out and place on the map.

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

Draw these landmarks, each as ONE separate object with a little of its own ground (a small patch of land, sand or water) and a soft white outline around the whole object, in the same oblique bird's-eye 45-degree view and the same light from the upper left:
1. Coiba Island: a lush island ringed by coral, a turtle and a pair of scarlet macaws.
2. Santa Catalina: a surf beach with a small cabin and a wave.
3. Santa Fe highlands: green hills with orchids and a trout stream.
4. San Francisco de la Montana: a small colonial church with a golden altar glimpse through the door.
5. Volcan Baru: a tall volcano with a cloud cap, forest below.
6. Boquete coffee farm: terraces of coffee bushes with red cherries and a drying patio.
7. Cerro Punta terraces: a patchwork of vegetable and strawberry fields on a steep hill.
8. Resplendent quetzal on a branch (emerald body, red chest, very long tail).
9. Bocas stilt houses: four candy-coloured wooden houses on stilts over turquoise water, with a dock.
10. Starfish Beach: shallow clear water with orange starfish and a few palms.
11. Banana plantation: rows of banana plants with a cart of bunches.
12. Portobelo fort: Spanish stone fort with cannons facing the bay, and a small church.
13. San Lorenzo fort: a stone fort on a cliff at a river mouth.
14. Gatun locks: a lock with a container ship entering.
15. Colon port: three tall cranes, stacked containers and a cruise ship.
16. Embera village: thatched stilt huts without walls around a clearing, with dugout canoes at a river.
17. Darien Gap: the Pan-American highway ending at the jungle edge, with a small road sign shape (no writing).
18. Guna Yala islets: three tiny sandbars with palms and thatched huts, a cayuco with a small sail with a geometric mola-style pattern.
19. Ngabe-Bugle hamlet: three small houses on a green hill with women in long geometric dresses.
20. Embera basket: a finely woven round basket with geometric patterns.

Each landmark is charming and recognisable at a small size, about 300 px wide each in the sheet, with clean silhouettes, no text or signs with writing. Leave generous white space between them so they can be cut out.
NO ground shadow outside each object's own patch, no glow, no floor spreading.

HARD RULES: NO TEXT anywhere (no letters, numbers, signs with writing, flags with writing). Do not redesign or redraw our mascots (a golden frog with brown spots and a straw hat, a harpy eagle, a sloth, a toucan); if they appear in the attached map they stay exactly as they are. Panama's coastline, island positions and province borders must stay exactly where they are in the attached map.

OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), objects in an even grid (4 columns), no grid lines, no labels, no text.
```

## 4. Attach `map-illustrated-clean-lo.png` (style reference)  →  save result as `village-kit.png`

Casitas, puertos y detalles pequeños para llenar el mapa y dar sitio a la gente. Se recortan y se colocan por código.

```
Attached is our illustrated map of Panama; use it as style reference. Draw a KIT of small buildings and props to populate the map, each an independent object that I can cut out.

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

Oblique bird's-eye 45-degree view, light from the upper left, each object about 160 px wide, soft white outline, no text, generous white space between them. Draw 5 variations of each type, different colours and sizes, in a grid of 5 columns:
Row 1: small Panamanian village houses (single storey, tin or tile roofs, painted in cheerful colours, small porch)
Row 2: Caribbean wooden houses on stilts (Bocas del Toro, Colon), candy colours
Row 3: thatched huts (Embera and Guna style), round or oval
Row 4: small colonial churches and plazas (white walls, bell tower, a few trees)
Row 5: dock and port props: wooden pier, fishing boat on a trailer, crane, stacked containers, fuel tank
Row 6: roadside details: bus stop shelter, fruit stand with umbrella, gas station, bridge section, road sign shape without writing
Row 7: nature props: palms, mangrove clump, banana plants, ceiba tree, rock cluster

HARD RULES: NO TEXT anywhere (no letters, numbers, signs with writing, flags with writing). Do not redesign or redraw our mascots (a golden frog with brown spots and a straw hat, a harpy eagle, a sloth, a toucan); if they appear in the attached map they stay exactly as they are. Panama's coastline, island positions and province borders must stay exactly where they are in the attached map.
NO ground shadow outside each object's own small patch, no glow.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), 5 columns x 7 rows, even grid, no grid lines, no labels, no text.
```

## 5. Gente caminando (ciclos de caminar)

Son 3 hojas (6 personajes). Cada una lleva la imagen del mapa solo como referencia de estilo.

## 5a. Attach `map-illustrated-clean-lo.png` (style reference only)  →  save result as `walkers-a.png`

```
Attached is our illustrated map of Panama; use it ONLY as the style reference (colours, softness, outline feel). Draw a WALK-CYCLE SPRITE SHEET of 2 tiny people for a living map.

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

CHARACTERS (stylised, friendly, slightly big heads, diverse skin tones and body types, never caricature):
- Walker A, a traveller: tourist with a yellow backpack, sun hat, cream shirt, green shorts, a camera on the chest
- Walker B, a fisherman: weathered man with a rolled-up blue shirt, rubber boots, a net over one shoulder and a small bucket

LAYOUT: a grid of 6 columns x 4 rows.
Row 1: Walker A, a traveller, walking toward the camera and to the right (south-east), 6 frames.
Row 2: the SAME character walking away from the camera and to the right (north-east), seen from behind/side, 6 frames.
Row 3: Walker B, a fisherman, walking toward the camera and to the right (south-east), 6 frames.
Row 4: the SAME character walking away from the camera and to the right (north-east), seen from behind/side, 6 frames.

WALK CYCLE: each row is a loop of 6 frames at constant size: frame 1 right foot contact, 2 down, 3 passing, 4 left foot contact, 5 down, 6 passing; arms swing opposite to legs; body bobs slightly; the head stays the same size and shape in every frame. The character must be IDENTICAL (clothes, colours, proportions) in all 12 cells of its two rows.

CAMERA AND SCALE: all drawings use the SAME oblique three-quarter bird's-eye view (camera looking down about 45 degrees, like a city-builder mobile game), light from the upper left. Each figure fills about 80% of its cell, standing/rolling on the cell's bottom-centre point (that point must be in exactly the same place in every cell so the animation does not jitter). The figures will be shown very small (about 30 px tall), so use bold readable silhouettes, big simple shapes, 3 to 4 main colours, clean dark-brown outline slightly thicker than fine detail, NO tiny details that vanish when small.
NO ground shadow, NO glow, NO floor: draw ONLY the figure, so shadows can be added by code.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), cells in an exact even grid with generous white space between them, no grid lines, no labels, no text.
```

## 5b. Attach `map-illustrated-clean-lo.png` (style reference only)  →  save result as `walkers-b.png`

```
Attached is our illustrated map of Panama; use it ONLY as the style reference (colours, softness, outline feel). Draw a WALK-CYCLE SPRITE SHEET of 2 tiny people for a living map.

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

CHARACTERS (stylised, friendly, slightly big heads, diverse skin tones and body types, never caricature):
- Walker C, a woman in pollera: woman wearing a white Panamanian pollera dress with colourful ribbon trim and a flower headpiece (small tembleques), no text
- Walker D, a farmer: man with a straw sombrero pintado (black and white pattern), white shirt, brown trousers, a machete sheath and a sack on the back

LAYOUT: a grid of 6 columns x 4 rows.
Row 1: Walker C, a woman in pollera, walking toward the camera and to the right (south-east), 6 frames.
Row 2: the SAME character walking away from the camera and to the right (north-east), seen from behind/side, 6 frames.
Row 3: Walker D, a farmer, walking toward the camera and to the right (south-east), 6 frames.
Row 4: the SAME character walking away from the camera and to the right (north-east), seen from behind/side, 6 frames.

WALK CYCLE: each row is a loop of 6 frames at constant size: frame 1 right foot contact, 2 down, 3 passing, 4 left foot contact, 5 down, 6 passing; arms swing opposite to legs; body bobs slightly; the head stays the same size and shape in every frame. The character must be IDENTICAL (clothes, colours, proportions) in all 12 cells of its two rows.

CAMERA AND SCALE: all drawings use the SAME oblique three-quarter bird's-eye view (camera looking down about 45 degrees, like a city-builder mobile game), light from the upper left. Each figure fills about 80% of its cell, standing/rolling on the cell's bottom-centre point (that point must be in exactly the same place in every cell so the animation does not jitter). The figures will be shown very small (about 30 px tall), so use bold readable silhouettes, big simple shapes, 3 to 4 main colours, clean dark-brown outline slightly thicker than fine detail, NO tiny details that vanish when small.
NO ground shadow, NO glow, NO floor: draw ONLY the figure, so shadows can be added by code.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), cells in an exact even grid with generous white space between them, no grid lines, no labels, no text.
```

## 5c. Attach `map-illustrated-clean-lo.png` (style reference only)  →  save result as `walkers-c.png`

```
Attached is our illustrated map of Panama; use it ONLY as the style reference (colours, softness, outline feel). Draw a WALK-CYCLE SPRITE SHEET of 2 tiny people for a living map.

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

CHARACTERS (stylised, friendly, slightly big heads, diverse skin tones and body types, never caricature):
- Walker E, a child: child with a school-uniform look (blue skirt or shorts, white shirt) and a red backpack, shorter than the adults, bouncy walk
- Walker F, a market vendor: woman with an apron and a headscarf carrying a big basket of fruit (bananas, oranges, papayas) on one hip

LAYOUT: a grid of 6 columns x 4 rows.
Row 1: Walker E, a child, walking toward the camera and to the right (south-east), 6 frames.
Row 2: the SAME character walking away from the camera and to the right (north-east), seen from behind/side, 6 frames.
Row 3: Walker F, a market vendor, walking toward the camera and to the right (south-east), 6 frames.
Row 4: the SAME character walking away from the camera and to the right (north-east), seen from behind/side, 6 frames.

WALK CYCLE: each row is a loop of 6 frames at constant size: frame 1 right foot contact, 2 down, 3 passing, 4 left foot contact, 5 down, 6 passing; arms swing opposite to legs; body bobs slightly; the head stays the same size and shape in every frame. The character must be IDENTICAL (clothes, colours, proportions) in all 12 cells of its two rows.

CAMERA AND SCALE: all drawings use the SAME oblique three-quarter bird's-eye view (camera looking down about 45 degrees, like a city-builder mobile game), light from the upper left. Each figure fills about 80% of its cell, standing/rolling on the cell's bottom-centre point (that point must be in exactly the same place in every cell so the animation does not jitter). The figures will be shown very small (about 30 px tall), so use bold readable silhouettes, big simple shapes, 3 to 4 main colours, clean dark-brown outline slightly thicker than fine detail, NO tiny details that vanish when small.
NO ground shadow, NO glow, NO floor: draw ONLY the figure, so shadows can be added by code.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), cells in an exact even grid with generous white space between them, no grid lines, no labels, no text.
```

## 5d. Attach `map-illustrated-clean-lo.png` (style reference)  →  save result as `people-activities.png`

Personas haciendo cosas en un lugar (se quedan quietas animando 4 cuadros), para dar vida a los puertos, playas y plazas.

```
Attached is our illustrated map of Panama; use it as style reference. Draw a sheet of 8 tiny people doing a looping activity, each as a row of 4 frames (4 columns x 8 rows).

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

Row 1: a fisherman casting a net from a small dock.
Row 2: a woman dancing in a white pollera dress, skirt swirling.
Row 3: a surfer carrying a board and waving.
Row 4: a farmer picking coffee cherries into a basket.
Row 5: a dock worker waving a flag at a ship (flag shapes only, no text).
Row 6: a child kicking a football.
Row 7: a vendor calling out beside a fruit stall (mouth open, arm raised).
Row 8: a drummer playing a small tamborito drum.

Each row is a smooth looping 4-frame action, same character in every frame, same size, same bottom-centre foot point in every cell.

CAMERA AND SCALE: all drawings use the SAME oblique three-quarter bird's-eye view (camera looking down about 45 degrees, like a city-builder mobile game), light from the upper left. Each figure fills about 80% of its cell, standing/rolling on the cell's bottom-centre point (that point must be in exactly the same place in every cell so the animation does not jitter). The figures will be shown very small (about 30 px tall), so use bold readable silhouettes, big simple shapes, 3 to 4 main colours, clean dark-brown outline slightly thicker than fine detail, NO tiny details that vanish when small.
NO ground shadow, NO glow, NO floor: draw ONLY the figure, so shadows can be added by code.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), cells in an exact even grid with generous white space between them, no grid lines, no labels, no text.
```

## 6. Attach `map-illustrated-clean-lo.png` (style reference)  →  save result as `vehicles.png`

Autos, buses y bicicletas. Se dibujan en 2 direcciones; las otras 2 se hacen reflejándolas.

```
Attached is our illustrated map of Panama; use it as style reference. Draw a SPRITE SHEET of 10 vehicles for a living map, each in TWO views: (a) heading toward the camera and to the right (south-east), (b) heading away from the camera and to the right (north-east). Grid: 2 columns (view a, view b) x 10 rows (one vehicle per row).

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

Vehicles (cheerful, slightly chunky, toy-like proportions, readable at 40 px wide):
1. Panamanian "diablo rojo" bus: a repainted old school bus covered in bold colourful airbrush graphics (flames, stripes, no text).
2. Yellow taxi sedan.
3. White pickup truck with a few crates in the bed.
4. Green 4x4 jeep with a roof rack and two surfboards.
5. Small cargo truck loaded with banana bunches.
6. Delivery truck with a blue container box (no logos).
7. Tourist minibus, white with a stripe.
8. Scooter with a rider and a helmet.
9. Bicycle with a rider and a basket.
10. Red tractor pulling a cart of sugar cane.

Wheels are drawn as plain round shapes (no spokes detail), no brand logos, no licence plates with writing.

CAMERA AND SCALE: all drawings use the SAME oblique three-quarter bird's-eye view (camera looking down about 45 degrees, like a city-builder mobile game), light from the upper left. Each figure fills about 80% of its cell, standing/rolling on the cell's bottom-centre point (that point must be in exactly the same place in every cell so the animation does not jitter). The figures will be shown very small (about 30 px tall), so use bold readable silhouettes, big simple shapes, 3 to 4 main colours, clean dark-brown outline slightly thicker than fine detail, NO tiny details that vanish when small.
NO ground shadow, NO glow, NO floor: draw ONLY the figure, so shadows can be added by code.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), cells in an exact even grid with generous white space between them, no grid lines, no labels, no text.
```

## 7. Fauna y ambiente

### 7a. Attach `map-illustrated-clean-lo.png` (style reference)  →  save result as `ambient-sea.png`

```
Attached is our illustrated map of Panama; use it as style reference. Draw a SPRITE SHEET of looping sea animals seen from above at a slight angle, each as a row of 6 smooth frames (6 columns).

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

Row 1: a humpback whale swimming, tail and back rolling (6 frames).
Row 2: a humpback whale breaching and splashing (6 frames, with white foam).
Row 3: two dolphins jumping in an arc (6 frames).
Row 4: a sea turtle swimming, flippers beating (6 frames).
Row 5: a manta ray gliding, wings flapping slowly (6 frames).
Row 6: a small shoal of fish as a dark shimmering silhouette just under the surface (6 frames).
Row 7: a pelican gliding over the water, then diving (6 frames).
Row 8: a cayuco (dugout canoe) with one fisherman paddling (6 frames).

The animals are drawn to sit on blue-green water; draw only a soft white ripple/foam ring around them, no water background. Do not draw a harpy eagle, sloth, toucan or frog: those are our mascots.

CAMERA AND SCALE: all drawings use the SAME oblique three-quarter bird's-eye view (camera looking down about 45 degrees, like a city-builder mobile game), light from the upper left. Each figure fills about 80% of its cell, standing/rolling on the cell's bottom-centre point (that point must be in exactly the same place in every cell so the animation does not jitter). The figures will be shown very small (about 30 px tall), so use bold readable silhouettes, big simple shapes, 3 to 4 main colours, clean dark-brown outline slightly thicker than fine detail, NO tiny details that vanish when small.
NO ground shadow, NO glow, NO floor: draw ONLY the figure, so shadows can be added by code.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), cells in an exact even grid with generous white space between them, no grid lines, no labels, no text.
```

### 7b. Attach `map-illustrated-clean-lo.png` (style reference)  →  save result as `ambient-air-land.png`

```
Attached is our illustrated map of Panama; use it as style reference. Draw a SPRITE SHEET of looping land and air animals, each as a row of 6 smooth frames (6 columns).

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.

Row 1: a pair of scarlet macaws flying, wings flapping (6 frames).
Row 2: a flock of five white egrets flying (6 frames).
Row 3: a blue morpho butterfly fluttering (6 frames).
Row 4: a resplendent quetzal gliding with its long tail (6 frames).
Row 5: a tapir walking (6 frames).
Row 6: a jaguar walking (6 frames).
Row 7: three cattle grazing and chewing (6 frames, slow).
Row 8: a small green iguana walking (6 frames).

Do not draw a harpy eagle, sloth, toucan or golden frog: those are our mascots and must not be redrawn.

CAMERA AND SCALE: all drawings use the SAME oblique three-quarter bird's-eye view (camera looking down about 45 degrees, like a city-builder mobile game), light from the upper left. Each figure fills about 80% of its cell, standing/rolling on the cell's bottom-centre point (that point must be in exactly the same place in every cell so the animation does not jitter). The figures will be shown very small (about 30 px tall), so use bold readable silhouettes, big simple shapes, 3 to 4 main colours, clean dark-brown outline slightly thicker than fine detail, NO tiny details that vanish when small.
NO ground shadow, NO glow, NO floor: draw ONLY the figure, so shadows can be added by code.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), cells in an exact even grid with generous white space between them, no grid lines, no labels, no text.
```

### 7c. Attach `map-illustrated-clean-lo.png` (style reference)  →  save result as `ambient-small-effects.png`

```
Attached is our illustrated map of Panama; use it as style reference. Draw a sheet of small looping effects for a living map, each a row of 6 frames on a flat PURE WHITE background.

Row 1: chimney smoke puff rising and fading.
Row 2: a campfire burning, flames flickering.
Row 3: a waving flag shape on a pole, no symbol or text.
Row 4: laundry on a line moving in the wind.
Row 5: a splash of white water from a dropped net.
Row 6: a small sparkle of water in the sun, a twinkle that grows and fades.
Row 7: a lighthouse beam sweeping (soft translucent wedge) on a small tower.
Row 8: a ship wake of white foam stretching behind (a short tail, moving).

STYLE: the same polished illustrated-map look as the attached map: soft gradients, clean shapes, white foam outlines, warm saturated colours, soft rim highlights. It must look hand-painted by a game artist, NOT like generic AI art: no plastic sheen, no melted details, no random noise, every tiny object readable and intentional.
CAMERA AND SCALE: all drawings use the SAME oblique three-quarter bird's-eye view (camera looking down about 45 degrees, like a city-builder mobile game), light from the upper left. Each figure fills about 80% of its cell, standing/rolling on the cell's bottom-centre point (that point must be in exactly the same place in every cell so the animation does not jitter). The figures will be shown very small (about 30 px tall), so use bold readable silhouettes, big simple shapes, 3 to 4 main colours, clean dark-brown outline slightly thicker than fine detail, NO tiny details that vanish when small.
NO ground shadow, NO glow, NO floor: draw ONLY the figure, so shadows can be added by code.
OUTPUT: one image on a flat PURE WHITE background (#FFFFFF), cells in an exact even grid with generous white space between them, no grid lines, no labels, no text.
```

## Siguientes pasos cuando lleguen las imágenes

1. Me pasas `map-options-sheet.png` y decidimos cuál mapa.
2. Con la elegida se hace el mapa final (prompt 2); después pediremos su versión de noche con el mismo método de `night-brief`.
3. Yo recorto las hojas con los scripts de siempre, reconstruyo el borde blanco, calculo los caminos y conecto la gente, los autos y la fauna en el mapa.
4. Probar en el celular: rendimiento (nada de tirones), que la gente no cruce el agua ni los edificios, y que de noche se vea bien.
