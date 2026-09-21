# Discrepancias con la app de Glide

> Fichero generado por `npm run glide:compare`. **No lo edites a mano**: los
> cambios se pierden en la siguiente ejecución. Lo que se toca es el CSV de
> referencia (`reference/glide-results.csv`), las notas a mano de `reference/glide-notas.md`
> o las fórmulas de `src/lib/formulas.ts`.

Última comparación: 2026-09-21

Casos comparados: **32** · Coinciden: **9** · Fallan: **23**

## Resumen por modo

| Modo | Casos | Fallan |
|---|---:|---:|
| `squat` — Sentadilla | 13 | 12 |
| `press` — Press | 6 | 6 |
| `pressAfterPress` — Press con press previo | 4 | 1 |
| `deadliftAfterSquat` — Peso muerto (después de sentadilla) | 5 | 4 |
| `deadliftNoSquat` — Peso muerto (sin sentadilla) | 4 | 0 |

## Patrones

Los fallos agrupados por el tipo de diferencia: cada fila es probablemente
**un solo bug**, por muchos pesos que arrastre.

| Diferencia | Casos | Dónde |
|---|---:|---|
| Serie 3 (reps) | 10 | `squat@15`, `squat@20`, `squat@30`, `squat@40`, `squat@50`, `squat@60`, `squat@70`, `squat@80`, `squat@100`, `deadliftAfterSquat@140` |
| Serie 1 (reps) + Serie 3 (reps) | 5 | `press@15`, `press@20`, `press@40`, `press@60`, `press@100` |
| Serie 3 (peso) | 4 | `squat@112.5`, `squat@140`, `squat@180`, `pressAfterPress@140` |
| Serie 2 (reps) | 3 | `deadliftAfterSquat@15`, `deadliftAfterSquat@60`, `deadliftAfterSquat@100` |
| Serie 1 (reps) + Serie 3 (peso) | 1 | `press@140` |

## Análisis

<!-- Escrito a mano en reference/glide-notas.md; se copia aquí tal cual. -->

Las 23 discrepancias salen de **cinco causas**, y ninguna es un caso suelto: son
reglas nuestras que no coinciden con la de Glide, así que cada arreglo tumba un
bloque entero. Los pesos, salvo el punto 3, están bien; lo que falla son sobre
todo las **repeticiones**.

### 1. Las reps de las series intermedias están fijadas por posición

Es la causa más grande: 14 casos (`squat@15…100`, `press@15…100`).

Nosotros emitimos siempre la misma rep para cada posición: en
`calculateSquatPress` la serie 2 lleva `reps: 'x3'` pase lo que pase. En Glide
las reps **descienden hasta `x1` en la última serie**, así que cuál sale en cada
posición depende de cuántas series haya:

| Modo | 3 series | 4 series | 5 series |
|---|---|---|---|
| Sentadilla / press | — | `x5x2, x4, x2, x1` | `x5x2, x4, x3, x2, x1` |
| Peso muerto tras sentadilla | `x5, x2, x1` | `x5, x3, x2, x1` | — |
| Peso muerto sin sentadilla | — | — | `x8, x5, x4, x2, x1` |

Con cuatro series el `x3` simplemente no aparece: se pasa de `x4` a `x2`. Eso es
exactamente lo que nos separa de Glide por debajo de 112,5 kg.

Arreglo: calcular las reps al final, una vez se sabe cuántas series hay, en vez
de escribirlas al construir cada serie.

### 2. El press muestra `x5x2` en la primera serie; Glide muestra `x5`

Los 6 casos de press. `src/routes/press.tsx:25` llama a `calculateSquatPress`,
que devuelve `x5x2` porque esa es la etiqueta de **sentadilla** —con su nota al
pie *"si no es el primer ejercicio, hacer sólo 1 serie"*—. En la pestaña de
Presses de Glide esa misma serie sale como `x5`, sin nota.

No es un fallo de pesos, es de etiquetado, pero afecta a todos los press.

### 3. La serie `x3` usa la fórmula de la serie `x2`

5 casos: `squat@112.5`, `squat@140`, `squat@180`, `press@140`,
`pressAfterPress@140`.

Por encima de 112,5 kg `calculateSquatPress` calcula la serie 2 (`x3`) y la
serie 3 (`x2`) con la **misma** expresión, `min(ceilTo2_5(0.8 * peso), 140)`.
Los números de Glide dicen que solo la segunda de las dos es así:

| Peso | Glide `x3` | Nosotros | `min(ceilTo2_5(0.7 × peso), 100)` |
|---:|---:|---:|---:|
| 112,5 | 80 | 90 | **80** |
| 140 | 100 | 112,5 | **100** |
| 180 | 100 | 140 | **100** |

La serie `x2` sí coincide en los tres casos con `min(ceilTo2_5(0.8 × peso), 140)`.
O sea: la fórmula del `0.8/140` se copió una serie de más, y la del `x3` debería
ser `0.7` con tope 100 — que es la continuación natural del `ceilTo2_5(0.7 *
peso)` que ya usamos por debajo de 112,5, y la misma regla que
`calculateDeadliftAfterSquat` aplica en ese tramo.

Este arreglo también cierra `pressAfterPress@140`, que hereda los pesos.

### 4. Peso muerto tras sentadilla: la serie intermedia va a `x2`, no a `x3`

3 casos (`deadliftAfterSquat@15`, `@60`, `@100`). Misma causa que el punto 1:
con solo 3 series la escalera es `x5, x2, x1` y nosotros damos `x3` fijo.

### 5. Peso muerto tras sentadilla a 140 kg: penúltima serie a `x2`, no a `x1`

1 caso. En `calculateDeadliftAfterSquat` la serie que solo aparece por encima de
112,5 se emite con `reps: 'x1'`, y la última también, así que damos dos `x1`
seguidas. Glide da `x2` en la penúltima. Dos series de una repetición seguidas
no tienen sentido como calentamiento: apunta a un error al portar la fórmula, no
a una decisión. Lo cubre el arreglo del punto 1.

---

**Lo que ya coincide** (9 de 32): los cuatro casos de peso muerto sin sentadilla
—con reps incluidas, que es la prueba de que la escalera del punto 1 es la
correcta—, tres de los cuatro de press con press previo, y los dos cortes de
`OUT_OF_RANGE` a 185 kg. Los pesos de sentadilla por debajo de 112,5 kg son
correctos en todos los casos capturados.

**Qué falta capturar de Glide:** pesos entre 100 y 112,5 (dónde cae exactamente
el salto a 5 series), algo por debajo de 15 kg (el `tooLight` nuestro no está
comprobado contra nada), y 181-184 kg para fijar el corte superior.

## Sentadilla (`squat`)

### 15 kg

- **Glide:** `10 x5x2 | 10 x4 | 12.5 x2 | 12.5 x1`
- **Nosotros:** `10 x5x2 | 10 x4 | 12.5 x3 | 12.5 x1`
- Serie 3 (reps): Glide "12.5 x2", nosotros "12.5 x3".

### 20 kg

- **Glide:** `10 x5x2 | 12.5 x4 | 15 x2 | 17.5 x1`
- **Nosotros:** `10 x5x2 | 12.5 x4 | 15 x3 | 17.5 x1`
- Serie 3 (reps): Glide "15 x2", nosotros "15 x3".

### 30 kg

- **Glide:** `20 x5x2 | 22.5 x4 | 25 x2 | 27.5 x1`
- **Nosotros:** `20 x5x2 | 22.5 x4 | 25 x3 | 27.5 x1`
- Serie 3 (reps): Glide "25 x2", nosotros "25 x3".

### 40 kg

- **Glide:** `20 x5x2 | 25 x4 | 30 x2 | 37.5 x1`
- **Nosotros:** `20 x5x2 | 25 x4 | 30 x3 | 37.5 x1`
- Serie 3 (reps): Glide "30 x2", nosotros "30 x3".

### 50 kg

- **Glide:** `20 x5x2 | 27.5 x4 | 37.5 x2 | 45 x1`
- **Nosotros:** `20 x5x2 | 27.5 x4 | 37.5 x3 | 45 x1`
- Serie 3 (reps): Glide "37.5 x2", nosotros "37.5 x3".

### 60 kg

- **Glide:** `20 x5x2 | 30 x4 | 42.5 x2 | 55 x1`
- **Nosotros:** `20 x5x2 | 30 x4 | 42.5 x3 | 55 x1`
- Serie 3 (reps): Glide "42.5 x2", nosotros "42.5 x3".

### 70 kg

- **Glide:** `20 x5x2 | 35 x4 | 50 x2 | 62.5 x1`
- **Nosotros:** `20 x5x2 | 35 x4 | 50 x3 | 62.5 x1`
- Serie 3 (reps): Glide "50 x2", nosotros "50 x3".

### 80 kg

- **Glide:** `20 x5x2 | 40 x4 | 57.5 x2 | 72.5 x1`
- **Nosotros:** `20 x5x2 | 40 x4 | 57.5 x3 | 72.5 x1`
- Serie 3 (reps): Glide "57.5 x2", nosotros "57.5 x3".

### 100 kg

- **Glide:** `20 x5x2 | 50 x4 | 70 x2 | 90 x1`
- **Nosotros:** `20 x5x2 | 50 x4 | 70 x3 | 90 x1`
- Serie 3 (reps): Glide "70 x2", nosotros "70 x3".

### 112.5 kg

- **Glide:** `20 x5x2 | 60 x4 | 80 x3 | 90 x2 | 102.5 x1`
- **Nosotros:** `20 x5x2 | 60 x4 | 90 x3 | 90 x2 | 102.5 x1`
- Serie 3 (peso): Glide "80 x3", nosotros "90 x3".
- _Nota de la captura:_ Umbral: a partir de 112.5 aparece una serie mas (5 en vez de 4)

### 140 kg

- **Glide:** `20 x5x2 | 60 x4 | 100 x3 | 112.5 x2 | 127.5 x1`
- **Nosotros:** `20 x5x2 | 60 x4 | 112.5 x3 | 112.5 x2 | 127.5 x1`
- Serie 3 (peso): Glide "100 x3", nosotros "112.5 x3".

### 180 kg

- **Glide:** `20 x5x2 | 60 x4 | 100 x3 | 140 x2 | 162.5 x1`
- **Nosotros:** `20 x5x2 | 60 x4 | 140 x3 | 140 x2 | 162.5 x1`
- Serie 3 (peso): Glide "100 x3", nosotros "140 x3".

## Press (`press`)

### 15 kg

- **Glide:** `10 x5 | 10 x4 | 12.5 x2 | 12.5 x1`
- **Nosotros:** `10 x5x2 | 10 x4 | 12.5 x3 | 12.5 x1`
- Serie 1 (reps): Glide "10 x5", nosotros "10 x5x2".
- Serie 3 (reps): Glide "12.5 x2", nosotros "12.5 x3".

### 20 kg

- **Glide:** `10 x5 | 12.5 x4 | 15 x2 | 17.5 x1`
- **Nosotros:** `10 x5x2 | 12.5 x4 | 15 x3 | 17.5 x1`
- Serie 1 (reps): Glide "10 x5", nosotros "10 x5x2".
- Serie 3 (reps): Glide "15 x2", nosotros "15 x3".

### 40 kg

- **Glide:** `20 x5 | 25 x4 | 30 x2 | 37.5 x1`
- **Nosotros:** `20 x5x2 | 25 x4 | 30 x3 | 37.5 x1`
- Serie 1 (reps): Glide "20 x5", nosotros "20 x5x2".
- Serie 3 (reps): Glide "30 x2", nosotros "30 x3".

### 60 kg

- **Glide:** `20 x5 | 30 x4 | 42.5 x2 | 55 x1`
- **Nosotros:** `20 x5x2 | 30 x4 | 42.5 x3 | 55 x1`
- Serie 1 (reps): Glide "20 x5", nosotros "20 x5x2".
- Serie 3 (reps): Glide "42.5 x2", nosotros "42.5 x3".

### 100 kg

- **Glide:** `20 x5 | 50 x4 | 70 x2 | 90 x1`
- **Nosotros:** `20 x5x2 | 50 x4 | 70 x3 | 90 x1`
- Serie 1 (reps): Glide "20 x5", nosotros "20 x5x2".
- Serie 3 (reps): Glide "70 x2", nosotros "70 x3".

### 140 kg

- **Glide:** `20 x5 | 60 x4 | 100 x3 | 112.5 x2 | 127.5 x1`
- **Nosotros:** `20 x5x2 | 60 x4 | 112.5 x3 | 112.5 x2 | 127.5 x1`
- Serie 1 (reps): Glide "20 x5", nosotros "20 x5x2".
- Serie 3 (peso): Glide "100 x3", nosotros "112.5 x3".
- _Nota de la captura:_ Mismos pesos que sentadilla; solo cambia la primera serie (x5 en vez de x5x2)

## Press con press previo (`pressAfterPress`)

### 140 kg

- **Glide:** `20 x5 | 60 x2 | 100 x1 | 112.5 x1 | 127.5 x1`
- **Nosotros:** `20 x5 | 60 x2 | 112.5 x1 | 112.5 x1 | 127.5 x1`
- Serie 3 (peso): Glide "100 x1", nosotros "112.5 x1".
- _Nota de la captura:_ Mismos pesos que press normal con las reps recortadas

## Peso muerto (después de sentadilla) (`deadliftAfterSquat`)

### 15 kg

- **Glide:** `15 x5 | 15 x2 | 15 x1`
- **Nosotros:** `15 x5 | 15 x3 | 15 x1`
- Serie 2 (reps): Glide "15 x2", nosotros "15 x3".

### 60 kg

- **Glide:** `40 x5 | 47.5 x2 | 55 x1`
- **Nosotros:** `40 x5 | 47.5 x3 | 55 x1`
- Serie 2 (reps): Glide "47.5 x2", nosotros "47.5 x3".

### 100 kg

- **Glide:** `60 x5 | 75 x2 | 90 x1`
- **Nosotros:** `60 x5 | 75 x3 | 90 x1`
- Serie 2 (reps): Glide "75 x2", nosotros "75 x3".

### 140 kg

- **Glide:** `60 x5 | 100 x3 | 112.5 x2 | 127.5 x1`
- **Nosotros:** `60 x5 | 100 x3 | 112.5 x1 | 127.5 x1`
- Serie 3 (reps): Glide "112.5 x2", nosotros "112.5 x1".
- _Nota de la captura:_ Hasta 112.5 son 3 series; por encima aparece una cuarta

## Cómo se comprueba

```bash
npm run glide:compare   # regenera este informe y los CSV de out/
npm run glide:check     # falla si la lista de discrepancias cambió
```

`glide:check` corre dentro de `npm run build`, así que cualquier cambio en las
fórmulas que rompa un caso que antes coincidía —o que arregle uno sin
actualizar este informe— para el build.

Ficheros generados en `out/` (no versionados):

- `nuestro-mismos-inputs.csv` — nuestras series para los inputs de la captura.
- `comparacion-glide.csv` — las dos columnas enfrentadas, con el estado.

Para anotar algo que sobreviva a la siguiente ejecución, escríbelo en
`reference/glide-notas.md`: se copia entero en la sección «Análisis».
