Las 23 discrepancias que había el 2026-09-21 están cerradas: los 32 casos
capturados dan exactamente lo mismo que Glide. Salían de **cinco causas**, y
ninguna era un caso suelto, así que cada arreglo tumbó un bloque entero.

### 1. Las reps se fijaban por posición (14 casos)

Glide no da una rep fija por posición: las hace **descender hasta `x1` en la
última serie**, así que cuál sale en cada sitio depende de cuántas series haya.
Nosotros escribíamos `x3` en la serie 2 pasara lo que pasara.

| Modo | 3 series | 4 series | 5 series |
|---|---|---|---|
| Sentadilla | — | `x5x2, x4, x2, x1` | `x5x2, x4, x3, x2, x1` |
| Press | — | `x5, x4, x2, x1` | `x5, x4, x3, x2, x1` |
| Peso muerto tras sentadilla | `x5, x2, x1` | `x5, x3, x2, x1` | — |
| Peso muerto sin sentadilla | — | — | `x8, x5, x4, x2, x1` |

Con cuatro series el `x3` simplemente no aparece: se pasa de `x4` a `x2`.

Arreglado en `src/lib/formulas.ts`: las fórmulas construyen la lista de **pesos**
y `withReps()` les pega la escalera al final, ya sabiendo cuántas series hay. Si
alguna vez sale un número de series sin escalera definida, revienta en vez de
inventarse una rep.

### 2. El press mostraba `x5x2` en la primera serie (6 casos)

`press.tsx` llamaba a la fórmula de sentadilla, que devuelve `x5x2` —con su nota
al pie *"si no es el primer ejercicio, hacer sólo 1 serie"*—. En la pestaña de
Presses de Glide esa misma serie es `x5`, sin nota.

Arreglado partiendo en dos la función: `calculateSquat` y `calculatePress`
comparten los pesos (`squatPressWeights`) y solo se diferencian en la escalera.
Un test recorre 5-180 kg comprobando que los pesos siguen siendo idénticos.

### 3. La serie `x3` usaba la fórmula de la serie `x2` (5 casos)

Por encima de 112,5 kg las dos series intermedias se calculaban con la **misma**
expresión, `min(ceilTo2_5(0.8 × peso), 140)`. Los números de Glide dicen que solo
la segunda es así; la del `x3` es al 70 % topada a 100:

| Peso | Glide `x3` | Antes | `min(ceilTo2_5(0.7 × peso), 100)` |
|---:|---:|---:|---:|
| 112,5 | 80 | 90 | **80** |
| 140 | 100 | 112,5 | **100** |
| 180 | 100 | 140 | **100** |

Es además la continuación natural del `ceilTo2_5(0.7 × peso)` que ya se usaba por
debajo de 112,5, así que la fórmula quedó con un solo caso para todo el tramo
≥ 60 kg. Esto cerró también `pressAfterPress@140`, que hereda los pesos, y quitó
de golpe los pesos duplicados de todo el rango alto.

### 4 y 5. Peso muerto tras sentadilla

Misma causa que el punto 1: con 3 series dábamos `x3` donde Glide da `x2`, y a
140 kg dábamos dos `x1` seguidas donde Glide da `x2, x1`. Los cubrió la escalera.

---

**Qué falta capturar de Glide.** La paridad está comprobada solo sobre los 32
puntos de la captura; entre ellos las fórmulas interpolan sin red:

- **100-112,5 kg**: dónde cae exactamente el salto de 4 a 5 series. Hoy lo
  ponemos en 112,5 porque es donde lo vimos, pero no está acotado por abajo.
- **Por debajo de 15 kg**: nuestro `tooLight` y los pesos de 5 a 12,5 kg no
  están comprobados contra nada.
- **181-184 kg**: para fijar el corte superior, que hoy ponemos en 180.
- **El tramo 140-180 kg**, donde entran los topes de 100 y 140 kg: solo tenemos
  140 y 180.
- **Pesos que no son múltiplo de 2,5 kg** (ver abajo). Toda la captura cae en la
  rejilla de 2,5, así que de la mitad del rango real no sabemos nada.

### El hueco de los 0,5 kg

Barriendo de 0,5 a 180 kg de 0,5 en 0,5, hay **68 pesos por modo** en los que
sacamos una serie que no se puede montar con discos: `18 kg` da
`10 | 12.5 | 15 | 15.5`, y ese `15,5` no existe en una barra.

No están repartidos: salen **todos** de las dos ramas de resta de
`calculateLastSet`, que devuelven el peso efectivo tal cual menos una constante
en vez de redondear a la rejilla.

| Rama | Tramo | Pesos afectados |
|---|---|---|
| `effective - 2.5` | 17,5 < ef ≤ 42,5 | 18-42, los que no son múltiplo de 2,5 |
| `effective - 5` | 45 < ef ≤ 62,5 | 45,5-62, íd. |

Hay además **un caso de serie que baja**: `deadliftAfterSquat@19.5` da
`15 | 17.5 | 17`, con la última por debajo de la anterior. Los invariantes no lo
cazan porque barren de 2,5 en 2,5.

**Esto no está tocado a propósito.** Puede que Glide haga exactamente lo mismo
—las dos ramas salieron de leer su árbol de fórmulas, que resta literalmente— y
sin capturas no hay forma de distinguir su comportamiento de un bug nuestro.

Para cerrarlo **no hacen falta las 360 muestras por modo**: basta con mirar en
Glide un puñado de pesos de esas dos rejillas. Con cuatro llega para decidir:

    18    (rama -2.5, primer peso afectado)
    19.5  (además, el único caso de serie que baja)
    31    (rama -2.5, en mitad del tramo)
    46.5  (rama -5)

Si Glide da `15,5` y `17` como nosotros, se anota tal cual y queda cerrado. Si
redondea, el arreglo es un `roundTo2_5`/`ceilTo2_5` en esas dos ramas y de paso
se amplía el barrido de los invariantes a 0,5 kg.

Añadir casos es editar `reference/glide-results.csv` y correr
`npm run glide:compare`.
