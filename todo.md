# TODO — Bugs detectados en la auditoría

Documento de trabajo para ir corrigiendo los bugs que provocan las **discrepancias entre esta app
y la app original de Glide** (ver sección "Discrepancias conocidas" del README).

Auditoría hecha el 2026-09-21 sobre el commit `efda391`. `npx tsc --noEmit` pasa limpio: ninguno de
estos bugs es un error de tipos, todos son de lógica o de comportamiento.

> ## ⚠️ Ya hay datos reales de Glide (2026-09-21)
>
> `reference/glide-results.csv` tiene 32 casos capturados de la app original, y
> `npm test` los contrasta caso por caso. Eso cambia cómo se trabaja este documento:
> **antes de aplicar cualquier "arreglo propuesto", mira si los datos lo respaldan.**
> Ya ha pasado con BUG-02, cuyo arreglo propuesto rompería tres casos que hoy pasan.
>
> El desglose de las 23 discrepancias vivas está en `reference/glide-notas.md`, y
> agrupa en **cinco causas** que este documento no tenía identificadas. Dos de ellas
> no corresponden a ningún BUG de la lista de abajo:
>
> - **Las reps van por posición y deberían ir por escalera.** Emitimos `x3` fijo en
>   la serie 2 pase lo que pase; en Glide las reps descienden hasta `x1` según
>   cuántas series haya, así que con 4 series se pasa de `x4` a `x2` y el `x3` no
>   aparece. Es la causa de 14 de las 23 discrepancias — la más grande de todas.
> - **El press muestra `x5x2` donde Glide muestra `x5`.** `press.tsx` reutiliza
>   `calculateSquatPress`, y ese `x5x2` es la etiqueta de *sentadilla*. Afecta a los
>   6 casos de press.
>
> Lo que ya coincide al 100%: peso muerto sin sentadilla, reps incluidas.

## Cómo trabajar este documento

1. Coge un bug empezando por los de prioridad **alta**.
2. Lee la sección "Evidencia": trae los valores reales que produce el código hoy. Reprodúcelos antes
   de tocar nada, para tener un antes/después.
3. Aplica el arreglo propuesto. Donde diga **requiere confirmación**, el valor correcto depende de la
   app original de Glide y no se puede deducir del código: no inventes números, pregunta al usuario
   (ver "Información que falta").
4. Marca la casilla y anota en la propia sección qué valores salen después del cambio.

### Contexto importante antes de tocar las fórmulas

El JSON de configuración de Glide del que salieron las fórmulas **no está en el repositorio ni en el
historial de git**. Por tanto:

- Los bugs 01-05 están identificados como **incoherencias internas** del código (series duplicadas,
  saltos en los umbrales, ramas que no hacen lo que parecen querer hacer). Eso es seguro.
- Cuál es el valor *correcto* que devolvería Glide, no lo es. Cada arreglo propuesto indica si es
  seguro o si necesita contraste con la app original.

### Verificación numérica

~~No hay tests.~~ **Ya los hay** (2026-09-21, ver BUG-10): `npm test` corre 154 casos. Antes de tocar
`src/lib/formulas.ts`, lánzalos para tener el "antes"; después, el diff de los tests que fallen es
exactamente el efecto de tu cambio.

Invariantes que se comprobaron simulando los tres cálculos de 5 a 180 kg en pasos de 2.5 kg:

| Invariante | Resultado |
|---|---|
| Ninguna serie pesa menos que la anterior | OK, 0 casos |
| Ninguna serie repite el peso de la anterior | **FALLA**: 35 casos sentadilla/press, 6 peso muerto sin sentadilla, 4 con sentadilla |
| Todos los pesos son múltiplos de 2.5 | OK con entradas múltiplo de 2.5; **FALLA** con otras entradas (BUG-04) |
| La última serie nunca supera el peso efectivo | OK, 0 casos |
| Los `CEILING` no sufren errores de coma flotante | OK, 0 desviaciones (probados los 5 coeficientes sobre todos los pesos en pasos de 0.25 kg) |

---

## Prioridad alta

### [ ] BUG-01 — La serie ×3 y la ×2 dan el mismo peso en sentadilla/press ≥112.5 kg

> **CONFIRMADO POR LOS DATOS DE GLIDE — y ya no está bloqueado** (2026-09-21).
> `reference/glide-results.csv` zanja las dos preguntas abiertas de esta sección:
>
> | Peso | Glide `x3` | Nosotros | `min(ceilTo2_5(0.7 × ef), 100)` |
> |---:|---:|---:|---:|
> | 112.5 | 80 | 90 | **80** |
> | 140 | 100 | 112.5 | **100** |
> | 180 | 100 | 140 | **100** |
>
> La hipótesis del `0.7` era correcta, **y sí lleva tope: 100 kg** (es lo que pedía
> confirmar el "Requiere confirmación" de abajo — a 180 kg Glide da 100, no 126).
> La serie `x2` sí coincide con `min(ceilTo2_5(0.8 × ef), 140)` en los tres casos:
> la fórmula del 0.8 se copió una serie de más.
>
> Arreglar esto cierra también `pressAfterPress@140`, que hereda los pesos.
> Al hacerlo fallará la lista de duplicados de `formulas.invariants.test.ts`, que
> habrá que recortar, y habrá que regenerar la baseline con `npm run glide:compare`.

**Fichero:** `src/lib/formulas.ts:77` (y `:82` para comparar)

**Síntoma:** a partir de 112.5 kg de peso efectivo, la serie de 3 repeticiones y la de 2 muestran
exactamente el mismo peso. Las dos se calculan con `MIN(CEILING(0.8 × efectivo / 2.5) × 2.5, 140)`.

**Causa:** la rama `else` del `set2` (línea 77) es un copy-paste de la fórmula del `set3` (línea 82).
El README documenta la ×3 como "interpolación 2/3" y la ×2 como la del 0.8, así que son fórmulas
distintas por diseño.

**Evidencia (salida actual):**

```
ef=112.5 → 20 (x5x2) / 60 (x4) / 90    (x3) / 90    (x2) / 102.5 (x1)
ef=140   → 20 (x5x2) / 60 (x4) / 112.5 (x3) / 112.5 (x2) / 127.5 (x1)
ef=180   → 20 (x5x2) / 60 (x4) / 140   (x3) / 140   (x2) / 162.5 (x1)
```

**Arreglo propuesto:** continuar el tramo inmediatamente inferior, que usa `ceilTo2_5(0.7 * effective)`.
Además de eliminar el duplicado, arregla un salto en el umbral: con 112 kg la ×3 da 80 kg y con
112.5 kg salta a 90 kg. Con `0.7` daría 80 → 80, continuo.

```ts
// src/lib/formulas.ts, dentro de calculateSquatPress
let set2: number
if (effective < 60) {
  set2 = roundTo2_5(set0 + 2 * (0.9 * effective - set0) / 3)
} else {
  set2 = ceilTo2_5(0.7 * effective)   // antes: Math.min(ceilTo2_5(0.8 * effective), 140) para >= 112.5
}
```

**Requiere confirmación:** si la ×3 pesada lleva tope (las otras dos fórmulas topan sus series
intermedias en 100 kg). Con `0.7` sin tope, a 180 kg la ×3 sale 126 kg.

---

### [~] BUG-02 — La serie ×4 congelada en 60 kg — **NO ES UN BUG, NO TOCAR**

> **Refutado por los datos de Glide** (2026-09-21). La app original **también**
> congela la serie ×4 en 60 kg en todo el tramo alto:
>
> | Peso | Glide `x4` | Nosotros |
> |---:|---:|---:|
> | 112.5 | 60 | 60 ✓ |
> | 140 | 60 | 60 ✓ |
> | 180 | 60 | 60 ✓ |
>
> La constante hardcodeada era fiel al original, no un descuido. El arreglo que
> propone esta sección —`min(ceilTo2_5(0.5 × ef), 100)`— daría 57.5 / 70 / 90 y
> **rompería los tres casos, que hoy pasan**.
>
> Se deja escrito lo de abajo tal cual porque el razonamiento era razonable con la
> información que había: las otras dos fórmulas sí escalan en ese tramo. Pero el
> contraste con la app real dice que aquí no. Es justo el motivo por el que la
> cabecera de este documento pide no inventar números.

**Fichero:** `src/lib/formulas.ts:66`

**Síntoma:** `set1 = 60` fijo para todo peso efectivo ≥112.5 kg. Vale lo mismo para 112.5 que para
180 kg. Combinado con BUG-01, el calentamiento de 180 kg salta de 60 kg a 140 kg de una serie a la
siguiente.

**Causa probable:** valor hardcodeado que quedó de un caso concreto. Las otras dos fórmulas sí
escalan en ese tramo: `calculateDeadliftNoSquat` usa `MIN(CEILING(0.65 × ef), 100)` y
`calculateDeadliftAfterSquat` usa `MIN(CEILING(0.7 × ef), 100)`. Sentadilla/press es la única que
usa una constante.

**Evidencia (salida actual):**

```
ef=110   → 20 / 55 (x4) / 77.5 / 100     ← tramo < 112.5: la x4 escala con 0.5 × ef
ef=112.5 → 20 / 60 (x4) / ...            ← salto y congelación
ef=180   → 20 / 60 (x4) / ...            ← sigue en 60
```

**Arreglo propuesto (requiere confirmación):** seguir el patrón de las otras dos fórmulas,
manteniendo el coeficiente 0.5 del tramo inferior y añadiendo el tope de 100 kg:

```ts
set1 = Math.min(ceilTo2_5(0.5 * effective), 100)
```

Esto da 57.5 kg a 112.5 (continuo con el tramo anterior) y 90 kg a 180 kg. Es una hipótesis: el
coeficiente y el tope hay que contrastarlos con la app original.

---

### [x] BUG-06 — No se pueden introducir pesos con decimales — **RESUELTO**

> **Resuelto el 2026-09-21.** `WeightInput` pasa a controlarse con el texto crudo en
> estado local y solo propaga hacia arriba el número parseado, así que `"7."` ya no se
> reescribe a `"7"`. Acepta también la coma, que es lo que ofrece el teclado numérico
> de un móvil en español. El parseo vive aparte en `src/lib/parse-weight.ts` para poder
> probarlo sin DOM: `parse-weight.test.ts` cubre la secuencia real de teclas de `7.5`.
> Verificado en el navegador tecla a tecla.

**Fichero:** `src/components/WeightInput.tsx:22` y `:35`

**Síntoma:** es imposible teclear 7.5, 42.5 o cualquier peso terminado en `.5`, que son la mitad de
los pesos reales de gimnasio. Probablemente el bug más visible de todos: el usuario no puede ni
introducir el peso del que quiere calentar.

**Causa:** es un input controlado con `value={value ?? ''}`, es decir, el input solo muestra lo que
hay en el estado, que es un `number`. Al teclear `7.5`:

1. `"7"` → `parseFloat` = 7 → estado 7 → el input muestra `"7"`. Bien.
2. `"7."` → `parseFloat("7.")` = 7 → estado sigue siendo 7 → React repinta `"7"` y **borra el punto**.
3. El `5` nunca llega a escribirse detrás de un punto.

**Arreglo propuesto:** mantener el texto crudo en un estado local del componente y propagar hacia
arriba solo el número parseado, sin reescribir lo que el usuario está tecleando:

```tsx
const [text, setText] = useState(value === null ? '' : String(value))

// resincronizar si el valor llega de fuera (cambio de pestaña, carga de localStorage)
useEffect(() => {
  if (value !== null && parseFloat(text.replace(',', '.')) !== value) {
    setText(String(value))
  }
}, [value])

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const raw = e.target.value
  if (!/^[0-9]*[.,]?[0-9]*$/.test(raw)) return   // rechaza letras, permite dígitos a medias
  setText(raw)
  const parsed = parseFloat(raw.replace(',', '.'))
  if (!isNaN(parsed) && parsed >= 0) onChange(parsed)
}
// ...
<input value={text} onChange={handleChange} ... />
```

Aceptar también la coma como separador decimal: el teclado numérico de un móvil en español ofrece
coma, y hoy `parseFloat("7,5")` devuelve 7 sin avisar.

**Verificar tras el arreglo:** teclear `7.5`, `7,5`, `102.5`, borrar entero el campo, y comprobar que
el valor sobrevive a cambiar de pestaña y recargar la app.

---

### [x] BUG-07 — No se puede borrar el campo de peso — **RESUELTO**

> **Resuelto el 2026-09-21** junto con BUG-06. Sobre la duda que planteaba esta sección:
> se optó por propagar `null` en vez de mantener el último cálculo válido, porque dejar
> la tabla colgada de un peso que ya no se ve en pantalla es justo la clase de confusión
> que hace levantar el peso equivocado. `onChange` pasa a `(value: number | null) => void`,
> los setters del store también, y `saveWeight(key, null)` borra la clave de localStorage
> en lugar de guardar `"null"`.

**Fichero:** `src/components/WeightInput.tsx:20`

**Síntoma:** al borrar con retroceso hasta dejar el campo vacío, reaparece el valor anterior. La
única forma de cambiar el peso es seleccionar todo y escribir encima.

**Causa:** `if (raw === '') return` descarta el evento sin actualizar el estado, y al repintar el
input vuelve a mostrar el número viejo.

**Arreglo propuesto:** se resuelve solo con el arreglo de BUG-06 (el texto crudo puede quedar vacío
aunque el número no cambie). Si se arreglan por separado, hay que decidir qué pasa con el estado al
vaciar: lo natural es dejar el texto vacío y no emitir `onChange`, de forma que el último cálculo
válido se mantenga hasta que se escriba un peso nuevo. Ojo: `onChange` está tipado como
`(value: number) => void`, no admite `null`; cambiarlo a `number | null` afectaría a
`src/store/weights.ts`, donde todos los setters son `(v: number) => void`.

---

### [x] BUG-08 — El modo "press previo" no está implementado — **RESUELTO**

> **Resuelto el 2026-09-21** en `calculatePressAfterPress` (`src/lib/formulas.ts`).
> El usuario aportó la regla que faltaba: **los pesos no cambian**, solo bajan las
> repeticiones. La serie base pasa de dos series de 5 a una sola, y las de arriba a
> 2, 1 y 1 (y 1 más en el tramo ≥112.5 kg). Se deriva de `calculateSquatPress` en vez
> de duplicar fórmulas, así que arreglar BUG-01 o BUG-02 corrige los dos modos a la
> vez. El input del press anterior se mantiene visible, por decisión del usuario, pero
> no entra en el cálculo. Cubierto en `formulas.test.ts`; verificado en el navegador.
> El punto 2 de "Información que falta" ya no necesita este dato.
>
> **Actualización (BUG-13):** ese segundo input se ha eliminado. Confundía más de lo que
> recordaba, porque parecía el sitio donde escribir el peso nuevo.

**Fichero:** `src/routes/press.tsx:22`

**Síntoma:** el botón "Si has hecho press antes, dale aquí" despliega un segundo input, pero el
cálculo que se muestra es exactamente el mismo que en modo normal. El peso introducido ahí
(`pressAltWeight`) se guarda en localStorage y no se usa para nada.

**Causa:** TODO explícito en el código:

```ts
if (altMode && pressAltWeight !== null && pressAltWeight > 0) {
  // TODO: Implement alternative warmup logic using pressAltWeight
  // For now, use the same formula
  return calculateSquatPress(pressWeight)
}
```

**Arreglo aplicado:**

| Serie | Press normal | Con press previo |
|---|---|---|
| Base (set0) | ×5 ×2 | ×5 |
| Set 1 | ×4 | ×2 |
| Set 2 | ×3 | ×1 |
| Set 3 (si ≥ 112.5 kg) | ×2 | ×1 |
| Última | ×1 | ×1 |

Salida a 60 kg: `20 x5 | 30 x2 | 42.5 x1 | 55 x1`.

---

## Prioridad media

### [ ] BUG-03 — El tope de diferencia de la última serie no topa nada

**Fichero:** `src/lib/formulas.ts:24-32`, dentro de `calculateLastSet`

**Síntoma:** los umbrales 7.5 / 10 / 12.5 parecen querer decir "la última serie de calentamiento no
puede quedarse a más de X kg del peso efectivo", pero cuando se supera ese margen, la rama
alternativa sube como mucho 2.5 kg y muchas veces no cambia nada, porque `ROUND` y `CEILING` del
mismo número coinciden.

```ts
const rounded = roundTo2_5(0.9 * effective)
return (effective - rounded <= 7.5) ? rounded : ceilTo2_5(0.9 * effective)
```

**Evidencia:** simulando de 62.5 a 137.5 kg en pasos de 0.1 kg, la rama `else` se ejecuta 360 veces y
en 78 de ellas devuelve exactamente lo mismo que la rama `then`. Casos donde el margen se incumple
pese a haber entrado en la rama que debía corregirlo:

```
ef=86    → última 77.5,  diferencia 8.5  (límite del tramo: 7.5)
ef=111   → última 100,   diferencia 11   (límite del tramo: 10)
ef=136   → última 122.5, diferencia 13.5 (límite del tramo: 12.5)
```

**Arreglo propuesto (requiere confirmación):** si la intención es el tope de diferencia, la forma de
expresarlo es coger el mayor de los dos candidatos:

```ts
const limit = 7.5  // 10 y 12.5 en los otros tramos
return Math.max(roundTo2_5(0.9 * effective), ceilTo2_5(effective - limit))
```

**Ojo:** con entradas múltiplo de 2.5 kg —que son la mayoría— este bug casi nunca se manifiesta, así
que no es el que explica las discrepancias del día a día. Pero la rama existe y hoy no hace lo que
dice hacer. Si el usuario confirma que Glide *no* aplica ningún tope, entonces lo correcto es
eliminar los ternarios y dejar solo `roundTo2_5(0.9 * effective)`, que es más simple y da el mismo
resultado en la práctica.

---

### [ ] BUG-04 — Pesos no cargables con entradas que no son múltiplo de 2.5

**Fichero:** `src/lib/formulas.ts:18` y `:22`

**Síntoma:** dos tramos de `calculateLastSet` restan sin redondear:

```ts
if (effective <= 42.5) return effective - 2.5
if (effective <= 62.5) return effective - 5
```

Con 46 kg la última serie sale **41 kg**, que no se puede montar con discos de 1.25. Con 21 kg sale
18.5 kg. Todos los demás tramos de la función sí redondean a 2.5.

**Evidencia:**

```
ef=21 → 18.5    ef=41 → 38.5    ef=51 → 46
ef=26 → 23.5    ef=46 → 41      ef=57 → 52
```

**Arreglo propuesto:** envolver ambas restas en `roundTo2_5(...)`. Con entradas múltiplo de 2.5 el
resultado no cambia, así que es un arreglo seguro que solo afecta a las entradas raras.

Alternativa complementaria: redondear el peso efectivo a 2.5 kg a la entrada de las tres funciones de
cálculo, ya que el input acepta cualquier decimal. Decidir cuál de las dos (o ambas) con el usuario.

---

### [x] BUG-09 — Peso muerto: los dos modos usan pesos guardados distintos — **RESUELTO**

> **Resuelto el 2026-09-21.** Un único `WeightInput` con `t.input.label` y un único
> `deadliftWeight`: el botón solo cambia de fórmula. `deadliftAltWeight` eliminado del
> store y de `storage.ts`, y `t.deadlift.alternativeLabel` de `i18n.ts`.
>
> Sobre el "requiere confirmación" de esta sección: no hizo falta contrastarlo con Glide,
> porque `calculateDeadliftNoSquat(effective)` siempre esperó el peso de la serie efectiva
> —igual que el otro modo—, así que el segundo input alimentaba ese mismo hueco con una
> etiqueta que pedía otra cosa. La etiqueta era el error, no la fórmula.
>
> Queda huérfana la clave `warmup_deadlift_alt_weight` en el localStorage de quien ya
> usara la app. Es inerte: nadie la lee.

**Fichero:** `src/routes/deadlift.tsx:21` y `:39`; etiquetas en `src/lib/i18n.ts`

**Síntoma:** al pulsar "Si NO has hecho sentadilla, dale aquí", la pantalla cambia a otro input
(`deadliftAltWeight`) y el resultado **desaparece** hasta que el usuario reescribe su peso. Al volver
al modo normal, otra vez el valor anterior. Son dos pesos independientes en localStorage para lo que
conceptualmente es el mismo dato: el peso de la serie efectiva de peso muerto de hoy.

Además la etiqueta del modo alternativo dice "Introduce tu peso de calentamiento", cuando lo que
`calculateDeadliftNoSquat(effective)` espera es el peso de la serie efectiva, igual que en el modo
normal. La etiqueta induce a meter un número distinto → discrepancia directa con Glide aunque la
fórmula fuese correcta.

**Arreglo propuesto:** usar `deadliftWeight` en ambos modos y que el botón solo cambie de fórmula:

```tsx
const result = useMemo(() => {
  if (deadliftWeight === null || deadliftWeight <= 0) return null
  return noSquatMode
    ? calculateDeadliftNoSquat(deadliftWeight)
    : calculateDeadliftAfterSquat(deadliftWeight)
}, [deadliftWeight, noSquatMode])
```

Quedaría un único `WeightInput` con `t.input.label`. Si se hace, `deadliftAltWeight` se queda sin uso
y conviene quitarlo de `src/store/weights.ts` y de `src/lib/storage.ts`.

**Requiere confirmación:** comprobar en la app original si el modo "sin sentadilla" pide de verdad un
segundo número distinto del peso efectivo. La etiqueta actual sugiere que alguien lo entendió así.

---

### [x] BUG-13 — Press: el segundo input no alimenta nada — **RESUELTO**

> **Resuelto el 2026-09-21.** Mismo patrón que BUG-09, ahora en press: un único `WeightInput`
> y un único `pressWeight`; el botón cambia de fórmula y de etiqueta. `pressAltWeight` eliminado
> del store y de `storage.ts`, y `t.press.alternativeLabel` de `i18n.ts`.
>
> Queda huérfana la clave `warmup_press_alt_weight` en el localStorage de quien ya usara la app.
> Es inerte: nadie la lee.

**Fichero:** `src/routes/press.tsx:50`; etiquetas en `src/lib/i18n.ts`

**Síntoma:** al pulsar "Si has hecho press antes, dale aquí" aparecía un segundo input. El cálculo
solo hacía caso del input principal, pero el nuevo campo —vacío y debajo del botón que se acaba de
pulsar— parecía justamente el sitio donde meter el peso del press de hoy. Escribir ahí no cambiaba
nada.

**Arreglo aplicado:** no se pinta un input nuevo. La etiqueta del input principal pasa a
"Introduce el peso de tu segundo press del día:" **en negrita** (`emphasizeLabel` en
`WeightInput`), de forma que el usuario ve que ha tocado algo sin que aparezca un campo que no
alimenta el cálculo.

Descartada la opción de Glide —navegar a otra pantalla—: el peso ya está escrito, y cambiar de
pantalla obliga a reescribirlo.

---

### [ ] BUG-05 — Series duplicadas en pesos bajos

> Las tres listas de pesos afectados están fijadas en `formulas.invariants.test.ts`
> (2026-09-21). Sigue en pie el "no tocar sin confirmar": si Glide produce lo mismo,
> el arreglo es cerrar el bug, no cambiar la fórmula.

**Fichero:** `src/lib/formulas.ts`, las tres funciones de cálculo

**Síntoma:** en pesos efectivos bajos, dos o tres series consecutivas muestran el mismo peso, porque
se interpola entre un `set0` relativamente alto y un 90% del efectivo que queda muy cerca.

**Evidencia:**

```
sentadilla/press, 35 casos:
  ef=5    → 5 / 5 / 5 / 5
  ef=10   → 5 / 7.5 / 7.5 / 7.5
  ef=15   → 10 / 10 / 12.5 / 12.5
  ef=22.5 → 15 / 17.5 / 17.5 / 20

peso muerto sin sentadilla, 6 casos:
  ef=15   → 15 / 15 / 15 / 15
  ef=20   → 15 / 15 / 17.5 / 17.5

peso muerto con sentadilla, 4 casos:
  ef=15   → 15 / 15 / 15
  ef=20   → 15 / 17.5 / 17.5
```

**Arreglo:** puede ser fiel al original (Glide podría producir exactamente lo mismo con las mismas
fórmulas), así que **no tocar sin confirmar**. Si se confirma que hay que corregirlo, la vía sensata
es colapsar series repetidas consecutivas sumando repeticiones, o saltarse las intermedias cuando
`set0` ya está a menos de 2.5 kg del 90% del efectivo. Afecta sobre todo a alumnos que empiezan, que
son justo los que más miran la app.

---

## Prioridad baja

### [x] BUG-10 — No hay tests — **RESUELTO**

> **Resuelto el 2026-09-21.** `npm test` → 154 tests. Corrección al enunciado original:
> `vitest` **no** estaba en `devDependencies` en `efda391`; se instaló ese mismo día, en
> paralelo a esta auditoría.
>
> Tres ficheros, con papeles distintos:
>
> - `src/lib/formulas.test.ts` — caracterización: 34 pesos × 4 modos, fijando lo que la
>   app hace hoy, **bugs incluidos**. Es la red de seguridad para tocar las fórmulas.
> - `src/lib/formulas.invariants.test.ts` — los invariantes de la tabla de arriba en
>   bucle de 2.5 a 180 kg, más la lista de duplicados conocidos (BUG-01 y BUG-05).
> - `src/lib/glide-parity.test.ts` — paridad contra Glide, leyendo la captura de
>   `reference/glide-results.csv` y la baseline de `reference/glide-baseline.json`.
>   32 casos: 9 coinciden y 23 son discrepancias conocidas, desglosadas en
>   `discrepancies.md`. El build las vigila con `npm run glide:check`.
>
> **Punto ciego conocido:** el invariante de múltiplos de 2.5 recorre solo entradas
> múltiplo de 2.5, así que hoy **no** detecta BUG-04. Para cubrirlo hay que barrer en
> pasos de 0.5, y entonces el test falla — a propósito, hasta que BUG-04 se arregle.

### [ ] BUG-11 — El modo alternativo se pierde al cambiar de pestaña

En `src/routes/press.tsx:18` y `src/routes/deadlift.tsx:18`, `altMode` / `noSquatMode` son `useState`
locales. Al navegar a otra pestaña y volver, el modo se resetea a normal mientras el peso sí persiste.
Si se considera parte del estado del usuario, llevarlo al store de Zustand junto con los pesos.

### [ ] BUG-12 — `src/App.tsx` es código muerto

`src/main.tsx` monta el router directamente; a `App.tsx` no lo importa nadie. Eliminar.

---

## Información que falta

Estos puntos no se pueden resolver leyendo el código. Hay que pedírselos al usuario.

**Casi todo lo que pedía esta sección ya está** en `reference/glide-results.csv` (32 casos,
capturados el 2026-09-21):

1. ~~**El JSON de configuración de Glide**~~ → no hizo falta: las capturas bastaron.
2. ~~**Capturas de la app original**~~ → hechas. Sentadilla a 112.5 / 140 / 180 fijó BUG-01 y
   refutó BUG-02; peso muerto en ambos modos, cubierto; press previo, cubierto.
3. ~~**Qué pide el segundo input** del modo "sin sentadilla"~~ → resuelto por lectura del código
   al cerrar BUG-09: siempre fue el peso de la serie efectiva; la etiqueta era el error.
4. Si la app original **acepta decimales** en el input y qué hace con un peso como 46 kg (BUG-04).
   **Sigue abierto**: las capturas son todas de pesos múltiplo de 2.5.

Lo que aún convendría capturar, según `reference/glide-notas.md`:

- Pesos entre 100 y 112.5 kg, para fijar dónde salta exactamente a 5 series.
- Algo por debajo de 15 kg: nuestro `tooLight` no está contrastado con nada.
- 181–184 kg, para fijar el corte superior con precisión.
