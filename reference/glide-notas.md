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
