# Vuelo hacia la provincia — resumen y prompt de imágenes

## A. Resumen del encargo (para cuando lleguen las imágenes)

**Idea:** en el mapa de Panamá el personaje elegido (Wawa, Yingying, Zuǐzuǐ o Lǎnlǎn) espera en la esquina inferior izquierda. Al tocar un marcador de provincia despega, vuela en curva hasta el marcador, encogiéndose, y el marcador lo absorbe. Después entra la pantalla de puerta que ya existe y de ahí directo a la lección.

**Secuencia (1.5–2.2 s):**
1. Reposo: sprite pequeño abajo-izquierda sobre el mapa, sin tapar la navegación, movimiento mínimo.
2. Toque: el marcador pulsa, el personaje se agacha y despega, estela tenue.
3. Vuelo: curva suave calculada con las posiciones reales de origen y marcador, alas moviéndose, escala decreciente (profundidad).
4. Absorción: pulso circular pequeño, el personaje se encoge más rápido hasta el centro exacto del marcador y desaparece dentro; última pulsación; transición a la puerta.

**Reglas:** mapa y personajes originales sin rediseñar, sin partículas ni efectos grandes, sin ovni; reutilizar el flujo de puertas y el progreso/checkpoints (cada provincia lleva a la siguiente lección real, sin mostrar cuántas quedan); bloquear toques repetidos mientras dura el viaje; respetar `prefers-reduced-motion`; iPhone y escritorio; recalcular coordenadas si cambia el tamaño o zoom del mapa; usar Motion y lo que ya hay, sin dependencias nuevas.

**Decisión nueva:** el prompt original solo habla de Yingying, pero hay 4 personajes. Wawa (rana dorada) y Lǎnlǎn (perezoso) no tienen alas, así que su "vuelo" será un salto-planeo con brazos al frente. Zuǐzuǐ (tucán) y Yingying (arpía) baten alas.

---

## B. Prompt para el agente de imágenes

**Adjuntar:** `design/assets/flight/refs/<personaje>-ref.png` (una hoja por personaje; el mismo prompt se repite 4 veces cambiando el bloque del personaje).

### Prompt base (común)

```
Attached is the official reference of one mascot, seen from behind in a relaxed standing pose.
Create ONE sprite sheet of this SAME character in 6 FLIGHT poses, arranged in a clean grid of
3 columns x 2 rows, every cell the same square size, the character the same size in every cell
and its body centre at the same point of each cell, with generous empty space between cells so
nothing overlaps or gets cropped.

Do NOT redesign the character. Keep exactly its face, proportions, colours, materials, outfit
and backpack from the reference, in the same soft polished 3D-rendered style, same lighting,
same level of detail. Background: flat pure white (#FFFFFF), no floor, no cast shadow, no
ground contact, no glow, no motion lines, no particles, no text, no labels, no numbers.

Camera: the character is flying AWAY from the viewer, so every pose is seen from behind /
three-quarter back, like the reference, slightly from above. Never front view.

The 6 poses, in reading order:
1. CROUCH: knees bent, body lowered and compressed, ready to launch.
2. UP: launch, body stretched upward, wings or arms raised high.
3. MID: neutral flight, wings or arms fully extended to the sides or forward, level body.
4. DOWN: same as MID but wings or arms sweeping downward, body slightly raised.
5. BANK: flight tilted about 25 degrees to the right, one side lower, still seen from behind.
6. TUCK: compact and small, wings/arms pulled in, head forward, diving into a target.

Consistency matters more than variety: poses 2, 3 and 4 must be the same wing/arm cycle of the
same character so they can be played as an animation loop without the character jumping.
```

### Bloque por personaje (se pega debajo del prompt base)

**Yingying (arpía)**
```
Character: Yingying, the harpy eagle. Keep the blue hat with the gold star and red pompom (hat
stays firmly on in every pose), grey feathers, yellow talons and the reddish-brown backpack.
She FLIES: broad wings flapping. Backpack stays on her back in every pose.
```

**Zuǐzuǐ (tucán)**
```
Character: Zuǐzuǐ, the toucan. Keep the flower crown, black plumage, rainbow beak, and the
blue and red feet, plus the reddish-brown backpack. He FLIES: wings flapping. Flowers stay on
the head in every pose.
```

**Wawa (rana dorada)**
```
Character: Wawa, the golden frog. Keep the straw hat (it stays on, as if tied
under the chin), golden skin with brown spots, pink cheeks, big webbed feet and the reddish-brown backpack. Wawa has NO
wings: instead of flapping, the poses are a heroic gliding leap through the air: arms stretched
forward and up, legs trailing, body arching. "Wings or arms" in the pose list means arms here.
```

**Lǎnlǎn (perezoso)**
```
Character: Lǎnlǎn, the sloth. Keep the straw hat (stays on, tied under the chin), brown fur,
white embroidered shirt, long claws and the reddish-brown backpack. Lǎnlǎn has NO wings:
instead the poses are a calm gliding leap through the air with long arms stretched forward,
legs trailing, serene relaxed expression. "Wings or arms" in the pose list means arms here.
```

### Entrega pedida
- 1 imagen por personaje, cuadrada, mínimo 2400x1600 (cada celda ~800 px).
- Mismo personaje y mismo tamaño en las 6 celdas. Sin texto.
- Nombres: `wawa-flight-sheet.png`, `harpia-flight-sheet.png`, `tucan-flight-sheet.png`, `sloth-flight-sheet.png`.

### Qué hago yo con ellas (Claude)
Cortar cada celda, quitar el fondo blanco, reconstruir el borde blanco tipo sticker como en el resto de sprites, normalizar tamaño/ancla y exportar a `app/public/journey/flight/<personaje>-<pose>.webp`: `crouch`, `up`, `mid`, `down`, `bank`, `tuck`.
La pose de reposo reutiliza `app/public/journey/door/<personaje>-rest.webp`.
