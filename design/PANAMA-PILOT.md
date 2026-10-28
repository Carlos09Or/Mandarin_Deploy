# Piloto: provincia de Panamá (Unidad 1)

Reparto del trabajo: Carlos consigue las imágenes con la IA de imágenes; Claude las arma,
las anima y las conecta en la app. Las tarjetas de lecciones NO llevan imagen.

Estilo de referencia: `assets/panama/skyline-day.webp` (usarla en el mismo chat de la IA).
Guardar todo en `assets/panama/` con estos nombres. Descargar en PNG.
Fondo transparente donde se indica (si la IA no puede, fondo blanco liso #ffffff).

## A. Imágenes

| ✔ | # | Archivo | Qué es | Formato | Qué hace Claude con ella |
|---|---|---|---|---|---|
| ✅ | 1 | `skyline-day.webp` | Fondo de la ruta, día | 9:16 | Fondo con parallax |
| ✅ | 2 | `skyline-night.webp` | Fondo de la ruta, noche | 9:16 | Fundido según la hora |
| ✅ | 3 | `landmark-canal.webp` | Meta de la unidad | 1:1 | Parada final de la ruta |
| ✅ | 4 | `map-illustrated.webp` | Mapa ilustrado de Panamá | 16:9 | Fondo del mapa (inicio) |
| ✅ | 5 | `map-fog.webp` | El mismo mapa cubierto de niebla | 16:9 | Capa que se borra provincia por provincia |
| ✅ | 6 | `map-cloud.webp` | Una nube suelta | 1:1, transparente | Nubes que se van volando al desbloquear |
| ✅ | 7 | `train.webp` | Tren completo de lado | 16:9, transparente | Lo mueve por el mapa y la ruta |
| ✅ | 8 | `train-wheel.webp` | Una rueda sola | 1:1, transparente | Ruedas que giran |
| ✅ | 9 | `train-travel.webp` | Tren cruzando un puente | 9:16 | Pantalla "All aboard!" |
| ✅ | 10 | `train-smoke.webp` | Una nube de humo | 1:1, transparente | Humo que sale y se desvanece |
| ✅ | 11 | `passport-cover.webp` | Tapa del pasaporte sin texto | 3:4 | Tapa; el texto lo pone la app |
| ✅ | 12 | `passport-page.webp` | Página de papel del pasaporte | 3:4 | Fondo de las páginas |
| ✅ | 13 | `stamp-panama.webp` | Sello de Panamá sin texto | 1:1, transparente | Sello animado; el texto lo pone la app |
| ✅ | 14 | `postcard-panama.webp` | Postal de Panamá | 3:2 | Postal del pasaporte |
| ✅ | 15 | `map-cloud-2/3/4.webp` (de `map-clouds-set.webp`) | Tres nubes más con otra forma | transparente | Variedad en las nubes |
| ✅ | 16 | `train-travel-empty.webp` | Puente sin tren | 9:16 | Fondo donde cruza el tren animado con las mascotas |
| ✅ | 17 | `nav-icons-set.webp` → `nav-*.webp` | 5 íconos de la barra de abajo | transparente | Mapa, Review, Write, Passport, Profile |
| ⚙️ | — | `map-*-clean.webp`, `boat-1/2.webp` | Mapas sin barcos + barcos sueltos | — | Los genera `tools/prep_map_boats.py`; volver a correrlo si cambia el mapa |
| ✳️ | — | Sellos | Ya no son imagen | — | Se dibujan en código (solo texto); `stamp-panama.webp` queda sin usar |

Para más adelante (no hacen falta para el piloto): ilustraciones de la lectura del ferrocarril y
las imágenes de las otras 9 provincias (2 fondos + 1 lugar emblemático + 1 sello + 1 postal cada una).

## B. Lo que hace Claude en código

- El mapa: niebla recortada con las formas reales de cada provincia, que se borra al desbloquearla.
- Armar y animar el tren (cuerpo, ruedas girando, humo).
- La ruta de Panamá, el viaje en tren, el pasaporte con el sello y la postal.
- Todo el texto (nombres, "PANAMÁ 巴拿马", fechas) en código, nunca dentro de las imágenes.

## C. Revisión antes de publicar

- ☐ Probar en el celular: mapa → ruta → lección → sello → tren → pasaporte.
