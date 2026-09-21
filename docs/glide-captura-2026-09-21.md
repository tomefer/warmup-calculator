# Captura de la app original de Glide — 2026-09-21

Fuente: <https://warmup-calculator.glide.page/>

Método: se introdujo cada peso en el campo "Introduce el peso de la serie
efectiva:" y se transcribió la tabla "Series de calentamiento:" tal y como la
pinta la app, sin normalizar nada.

La versión normalizada y comparable está en
[`reference/glide-results.csv`](../reference/glide-results.csv), que es la que
consume `npm run glide:compare` para escribir `discrepancies.md`. Este documento
es la materia prima: sirve para resolver dudas de transcripción sin volver a
abrir la app.

## Notas de lectura

- Los pesos salen con **coma decimal** y de forma **inconsistente**: unas
  celdas llevan dos decimales (`60,00`, `112,50`) y otras no (`55`, `127,5`).
- En Sentadilla la primera serie es `x5x2*`, con la nota al pie
  *"\*Si no es el primer ejercicio, hacer sólo 1 serie"*. En Presses la misma
  serie es `x5`, sin nota.
- Por encima de **180 kg** la app no calcula: muestra
  *"¡Ya eres experto, calcúlalo tú! 😉"*.
- El peso introducido es **compartido entre las tres pestañas** (una única
  columna en la tabla de Glide): si lo cambias en Sentadilla, Presses arrastra
  el mismo valor.
- La app tarda **20-30 segundos** en renderizar el campo de entrada. Antes de
  eso la pantalla solo muestra los textos estáticos y parece rota.

## Sentadilla (SQ)

| Peso | Serie 1 | Serie 2 | Serie 3 | Serie 4 | Serie 5 |
|---|---|---|---|---|---|
| 15 | 10 x5x2* | 10,00 x4 | 12,50 x2 | 12,5 x1 | — |
| 20 | 10 x5x2* | 12,50 x4 | 15,00 x2 | 17,5 x1 | — |
| 30 | 20 x5x2* | 22,50 x4 | 25,00 x2 | 27,5 x1 | — |
| 40 | 20 x5x2* | 25,00 x4 | 30,00 x2 | 37,5 x1 | — |
| 50 | 20 x5x2* | 27,50 x4 | 37,50 x2 | 45 x1 | — |
| 60 | 20 x5x2* | 30,00 x4 | 42,50 x2 | 55 x1 | — |
| 70 | 20 x5x2* | 35,00 x4 | 50,00 x2 | 62,5 x1 | — |
| 80 | 20 x5x2* | 40,00 x4 | 57,50 x2 | 72,5 x1 | — |
| 100 | 20 x5x2* | 50,00 x4 | 70,00 x2 | 90 x1 | — |
| 112,5 | 20 x5x2* | 60,00 x4 | 80,00 x3 | 90,00 x2 | 102,5 x1 |
| 140 | 20 x5x2* | 60,00 x4 | 100,00 x3 | 112,50 x2 | 127,5 x1 |
| 180 | 20 x5x2* | 60,00 x4 | 100,00 x3 | 140,00 x2 | 162,5 x1 |
| 185 | "¡Ya eres experto, calcúlalo tú! 😉" | | | | |

A partir de 112,5 kg aparece una serie más (cinco en vez de cuatro).

## Presses (P, BP)

Mismos pesos que Sentadilla; cambia la primera serie (`x5`, no `x5x2`) y no
hay nota al pie.

| Peso | Serie 1 | Serie 2 | Serie 3 | Serie 4 | Serie 5 |
|---|---|---|---|---|---|
| 15 | 10 x5 | 10,00 x4 | 12,50 x2 | 12,5 x1 | — |
| 20 | 10 x5 | 12,50 x4 | 15,00 x2 | 17,5 x1 | — |
| 40 | 20 x5 | 25,00 x4 | 30,00 x2 | 37,5 x1 | — |
| 60 | 20 x5 | 30,00 x4 | 42,50 x2 | 55 x1 | — |
| 100 | 20 x5 | 50,00 x4 | 70,00 x2 | 90 x1 | — |
| 140 | 20 x5 | 60,00 x4 | 100,00 x3 | 112,50 x2 | 127,5 x1 |

## Presses → "Dale aquí" (si has hecho justo antes banca o press)

Botón que abre una subpantalla. **No pide el peso del press anterior**: usa los
mismos pesos que Presses normal y solo recorta las repeticiones.

| Peso | Serie 1 | Serie 2 | Serie 3 | Serie 4 | Serie 5 |
|---|---|---|---|---|---|
| 15 | 10 x5 | 10,00 x2 | 12,50 x1 | 12,5 x1 | — |
| 60 | 20 x5 | 30,00 x2 | 42,50 x1 | 55 x1 | — |
| 100 | 20 x5 | 50,00 x2 | 70,00 x1 | 90 x1 | — |
| 140 | 20 x5 | 60,00 x2 | 100,00 x1 | 112,50 x1 | 127,5 x1 |

## Peso Muerto (DL) — pantalla por defecto

Es el caso "ya has hecho sentadillas antes". Menos series que los demás modos.

| Peso | Serie 1 | Serie 2 | Serie 3 | Serie 4 |
|---|---|---|---|---|
| 15 | 15 x5 | 15,00 x2 | 15 x1 | — |
| 60 | 40 x5 | 47,50 x2 | 55 x1 | — |
| 100 | 60 x5 | 75,00 x2 | 90 x1 | — |
| 140 | 60 x5 | 100,00 x3 | 112,50 x2 | 127,5 x1 |
| 185 | "¡Ya eres experto, calcúlalo tú! 😉" | | | |

## Peso Muerto → "Dale aquí" (si NO has hecho antes sentadillas)

Añade delante una serie de RDL con la barra vacía.

| Peso | Serie 0 | Serie 1 | Serie 2 | Serie 3 | Serie 4 |
|---|---|---|---|---|---|
| 15 | RDL con barra vacía x8 | 15 x5 | 15,00 x4 | 15,00 x2 | 15 x1 |
| 60 | RDL con barra vacía x8 | 30 x5 | 37,50 x4 | 45,00 x2 | 55 x1 |
| 100 | RDL con barra vacía x8 | 50 x5 | 62,50 x4 | 77,50 x2 | 90 x1 |
| 140 | RDL con barra vacía x8 | 60 x5 | 92,50 x4 | 112,50 x2 | 127,5 x1 |

## Umbrales vistos en la definición de la app

Extraídos del árbol de fórmulas que publica Glide (`if-then-else` anidados
sobre la columna del peso efectivo): los cortes están en **180** (por encima,
sin resultado), **112,5** y **60**.
