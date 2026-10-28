# Palabras de Panama y Panama Oeste (unidades 1 y 2)

Solo las 60 palabras de las dos provincias del piloto. Para presentar una palabra nueva la desarmamos en sus partes
(radical + componente) con una ilustración que cuenta esa historia; la pantalla de la lección se queda limpia.

| Archivo | Qué tiene |
|---|---|
| `panama-words.csv` | Las 60 palabras: provincia, lección y de qué caracteres están hechas |
| `panama-characters.csv` | Los 55 caracteres distintos: partes con su significado, la frase para recordarlo, el nombre de la imagen y el prompt |
| `panama-characters.json` | Lo mismo (partes y frase) listo para que la app lo use |

Una imagen por carácter (no por palabra): 老师 usa la de 老 y la de 师. El prompt deja libre el cuarto de arriba de la imagen
porque los caracteres y sus partes los escribe la app (la IA escribe mal el chino).

Revisar las frases de 么, 呢, 喂, 那 y 些: son caracteres cuya historia es más débil.

## Pictogramas (la transición tipo Duolingo)

`pictogramas.md` tiene las 11 tandas de prompts (31 partes dibujables) y `refs/tanda-NN.png` la imagen de referencia
de cada tanda. Los resultados van a `pictos/<id>.webp` con fondo transparente. Sin figura, solo con trazos:
师, 弟, 哥, 那, 么, 关, 些 (sus partes no tienen una forma dibujable clara).
