# Warmup Calculator

App web progresiva (PWA) para calcular las series de calentamiento de Starting Strength. Reemplaza la app de Glide actual, que tiene el problema de que el input de peso es compartido entre todos los usuarios.

## El problema que resuelve

La app de Glide original usa un input global: cuando cualquier alumno introduce su peso, sobreescribe el valor para todos los demás. Esta app guarda el peso de cada ejercicio localmente en el dispositivo de cada usuario.

## Ejercicios

- **Sentadilla**
- **Presses** (press militar / press de banca) — con modo alternativo si ya has hecho otro press antes
- **Peso muerto** — con modo alternativo si NO has hecho sentadilla antes

## Instalación en el móvil

Al abrir la app en el navegador del móvil, aparecerá la opción de "Añadir a pantalla de inicio". Una vez instalada funciona sin conexión.

## Estado actual de las fórmulas

Las fórmulas de cálculo se extrajeron directamente del JSON de configuración de la app Glide original. Hoy **coinciden con Glide en los 32 casos capturados** (`npm run glide:check` da 0 discrepancias, y el build lo vigila).

Ojo con el alcance: los 32 pesos capturados son todos múltiplo de 2,5 kg. Entre ellos las fórmulas interpolan sin comprobar, y en las entradas que no caen en esa rejilla hay series no montables con discos — ver BUG-04 en [`todo.md`](todo.md) y la sección «El hueco de los 0,5 kg» de [`reference/glide-notas.md`](reference/glide-notas.md).

### Lógica implementada

#### Sentadilla y Press (modo normal)

El calentamiento se construye en 4-5 series partiendo de un peso base (`set0`) hasta aproximar el 90% del peso efectivo.

**Peso base (`set0`):**
| Peso efectivo | Set 0 |
|---|---|
| ≥ 30 kg | 20 kg |
| ≥ 22.5 kg | 15 kg |
| ≥ 15 kg | 10 kg |
| ≥ 12.5 kg | 7.5 kg |
| ≥ 5 kg | 5 kg |

**Series intermedias:**
- Serie 1: por debajo de 60 kg, interpolación 1/3 entre set0 y el 90% del efectivo; de 60 a 112.5 kg, `CEILING(0.5 × ef)`; por encima, fija en 60 kg
- Serie 2: por debajo de 60 kg, interpolación 2/3; a partir de 60 kg, `MIN(CEILING(0.7 × ef / 2.5) × 2.5, 100)`
- Serie 3: solo si efectivo ≥ 112.5 kg → `MIN(CEILING(0.8 × ef / 2.5) × 2.5, 140)`

**Serie última (×1):**
Aproximación al 90% del efectivo con redondeo fino según tramos.

**Repeticiones:** no van por posición. En Glide descienden hasta ×1 en la última
serie, así que dependen de cuántas series haya; con 4 series el ×3 no aparece.

| Modo | 3 series | 4 series | 5 series |
|---|---|---|---|
| Sentadilla | — | `×5×2, ×4, ×2, ×1` | `×5×2, ×4, ×3, ×2, ×1` |
| Press | — | `×5, ×4, ×2, ×1` | `×5, ×4, ×3, ×2, ×1` |
| Peso muerto tras sentadilla | `×5, ×2, ×1` | `×5, ×3, ×2, ×1` | — |
| Peso muerto sin sentadilla | — | — | `×8, ×5, ×4, ×2, ×1` |

Sentadilla y press usan **los mismos pesos**; lo único que cambia es la serie
base, que en sentadilla es ×5 ×2 (con la nota al pie "si no es el primer
ejercicio, hacer sólo 1 serie") y en press es ×5.

#### Press con press previo

Cuando ya has hecho otro press antes (militar tras banca o al revés), **los pesos
son exactamente los del press normal**: lo único que baja son las repeticiones,
porque ya llegas caliente. La serie base pasa de dos series de 5 a una sola.

| Serie | Press normal | Con press previo |
|---|---|---|
| Base (set0) | ×5 | ×5 |
| Set 1 | ×4 | ×2 |
| Set 2 | ×2 (×3 si hay 5 series) | ×1 |
| Set 3 (si ≥ 112.5 kg) | ×2 | ×1 |
| Última | ×1 | ×1 |

El input "peso del press anterior" se guarda pero no entra en el cálculo: sirve
de recordatorio.

#### Peso muerto sin sentadilla previa

Añade una serie -1 de "RDL con barra vacía" (×8). El peso base es más alto que en sentadilla. Las intermedias interpolan igual pero con umbrales distintos.

#### Peso muerto con sentadilla previa

El peso base es menor (la sentadilla ya ha calentado). Solo 2 series intermedias antes de la última.

### Discrepancias conocidas: ninguna

Los 32 casos capturados de la app original coinciden con los nuestros. Está
**medido y contado** en [`discrepancies.md`](discrepancies.md), que se regenera
con `npm run glide:compare` comparando contra la captura de Glide de
[`reference/glide-results.csv`](reference/glide-results.csv).

Hubo 23 fallos, salidos de cinco causas; el desglose de qué era cada uno y cómo
se cerró está en [`reference/glide-notas.md`](reference/glide-notas.md), que se
copia dentro de `discrepancies.md`.

**Lo que no está comprobado** es tan importante como lo que sí: la captura solo
cubre pesos múltiplo de 2,5 kg entre 15 y 185. Faltan el tramo 100-112,5 (dónde
salta exactamente de 4 a 5 series), los pesos por debajo de 15, el corte de
181-184, y sobre todo **las entradas que no son múltiplo de 2,5** — ahí sacamos
series no montables con discos, y sin capturas no se sabe si Glide hace lo mismo.

**Si ves alguna discrepancia, abre un issue con:**
- El ejercicio y modo (sentadilla / press normal / press con press previo / peso muerto con sentadilla / peso muerto sin sentadilla)
- El peso efectivo que introdujiste
- Lo que muestra la app original
- Lo que muestra esta app

Eso nos ayudará a identificar exactamente dónde está la diferencia.

## Tabla completa de calentamientos (CSV)

Para revisar las fórmulas de un vistazo —y para comparar contra la app de Glide sin ir peso a peso— hay un comando que vuelca a CSV **todos** los pesos efectivos de 0,5 en 0,5 kg, para los cuatro modos:

```bash
npm run warmup:csv
```

Genera `out/warmup-wide.csv` (ignorado por git): 10–200 kg cada 0,5 kg × 4 modos = 1524 filas, una por peso, con una columna por serie.

```
ejercicio_id,ejercicio,peso_efectivo_kg,n_series,serie_1,serie_2,serie_3,serie_4,serie_5,aviso
sentadilla,Sentadilla,100,4,20 kg x5x2,50 kg x4,70 kg x3,90 kg x1,,
```

El script importa las funciones de `src/lib/formulas.ts`, así que la tabla nunca se desincroniza de lo que muestra la app. Los pesos por debajo del mínimo de cada modo y los mayores de 180 kg salen sin series y con el motivo en la columna `aviso`.

### Opciones

| Opción | Qué hace |
|---|---|
| `--format long` | Una fila por serie en vez de por peso, con `peso_serie_kg` y `reps` en columnas aparte (mejor para pivotar o diffear) |
| `--excel-es` | Separador `;`, decimales con coma y BOM UTF-8, para que Excel en español lo abra bien de doble clic |
| `--min` / `--max` / `--step` | Acota el barrido, p. ej. `--min 60 --max 120 --step 2.5` |
| `--exercise <id>` | Filtra un modo; repetible. Ids: `sentadilla`, `press`, `peso-muerto`, `peso-muerto-sin-sentadilla` |
| `--out <ruta>` | Otro fichero, o `-` para volcar por stdout |
| `--help` | Lista todas las opciones |

Ejemplos:

```bash
# Excel en español, todas las series desglosadas
npm run warmup:csv -- --format long --excel-es

# Solo peso muerto sin sentadilla, tramo alto, por pantalla
npm run warmup:csv -- --exercise peso-muerto-sin-sentadilla --min 100 --max 180 --out -
```

Requiere Node 22.18+ o 24+ (el script es TypeScript y lo ejecuta Node directamente, sin dependencias extra).

## Comparación contra la app de Glide

`npm run warmup:csv` dice qué hace nuestra app. Para saber **en qué se diferencia
de Glide** hay un segundo comando, que no hay que ir cruzando a mano:

```bash
npm run glide:compare
```

Lee la captura de Glide de `reference/glide-results.csv`, calcula lo nuestro para
esos mismos inputs, enfrenta las dos columnas y escribe:

| Fichero | Qué es |
|---|---|
| `discrepancies.md` | El informe: resumen por modo, patrones, el análisis a mano y caso por caso. **Versionado** |
| `reference/glide-baseline.json` | La foto de las discrepancias aceptadas hoy. **Versionado** |
| `out/nuestro-mismos-inputs.csv` | Nuestras series para cada input de la captura |
| `out/comparacion-glide.csv` | `modo, peso, glide, nuestro, estado, diferencias` |

Por pantalla imprime los casos que fallan, con la diferencia explicada serie a
serie:

```
  Peso muerto (después de sentadilla) @ 60 kg
    Glide:    40 x5 | 47.5 x2 | 55 x1
    Nosotros: 40 x5 | 47.5 x3 | 55 x1
    · Serie 2 (reps): Glide "47.5 x2", nosotros "47.5 x3".
```

### Se comprueba en cada build

`npm run build` ejecuta antes `npm run glide:check`, que recalcula la comparación
y la contrasta con la baseline **sin escribir nada**. El build se para si la lista
de discrepancias cambia, en cualquiera de los dos sentidos:

- **REGRESIÓN** — un caso que coincidía con Glide ha dejado de coincidir.
- **ARREGLADO** / **CAMBIADO** — una discrepancia conocida ha desaparecido o da
  otra cosa. Es buena noticia, pero hay que actualizar el informe.

En los dos casos la salida a arreglarlo es la misma: `npm run glide:compare`,
revisar el diff de `discrepancies.md` y `reference/glide-baseline.json`, y
commitearlo con el cambio que lo provocó. Así el informe nunca miente sobre el
estado del código.

### Añadir casos a la captura

Cuantos más pesos haya en `reference/glide-results.csv`, más fina es la
comparación. Se añade una fila por caso:

```
modo,peso_efectivo_kg,series,fuente,nota
squat,120,20 x5x2 | 60 x4 | 85 x3 | 97.5 x2 | 107.5 x1,captura 2026-10-01,
```

- `modo`: `squat`, `press`, `pressAfterPress`, `deadliftAfterSquat` o
  `deadliftNoSquat`.
- `series`: lo que pinta Glide, separado por `|`. Si no calcula el peso,
  `OUT_OF_RANGE`.
- Se tolera cómo lo escribe Glide: coma decimal, ceros de más (`60,00`), el
  sufijo ` kg`, el asterisco de la nota al pie (`x5x2*`) y el literal
  `RDL con barra vacía`.

Después, `npm run glide:compare` para meter los casos nuevos en el informe y en
la baseline. La materia prima de la captura actual —las tablas tal y como las pinta Glide,
sin normalizar— está en [`docs/glide-captura-2026-09-21.md`](docs/glide-captura-2026-09-21.md).

## Stack técnico

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- TanStack Router
- Zustand (estado)
- localStorage (persistencia)
- PWA (instalable en móvil)

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## Tests

```bash
npm test          # una pasada
npm run test:watch
```

Tres ficheros, con papeles distintos:

- **`src/lib/formulas.test.ts`** — tests de caracterización. Tablas de
  `peso efectivo → series` que registran lo que la app hace **hoy**, bugs
  incluidos. No son la verdad: son una red de seguridad para refactorizar sin
  cambiar resultados sin querer.
- **`src/lib/formulas.invariants.test.ts`** — propiedades que deben cumplirse
  sea cual sea la fórmula (el peso nunca baja entre series, todo es múltiplo de
  2.5 kg, la última serie no supera la efectiva). Aquí está también la lista de
  series duplicadas conocidas.
- **`src/lib/glide-parity.test.ts`** — paridad con la app original, la única
  fuente de verdad. Lee los casos de `reference/glide-results.csv` (el mismo CSV
  y el mismo parser que `npm run glide:compare`) y lo que se espera de cada uno
  de `reference/glide-baseline.json`: los que no están en la baseline tienen que
  coincidir con Glide, y los 23 conocidos se comprueban con `it.fails`, así que
  el test salta también cuando uno **deja** de fallar.

### Cómo cazar una discrepancia

1. Abre la app de Glide y apunta un caso: modo, peso efectivo y las series que
   muestra.
2. Añade la fila a `reference/glide-results.csv` (formato arriba, en
   "Comparación contra la app de Glide").
3. `npm run glide:compare`. Te dice si el caso nuevo coincide o no, y lo mete en
   `discrepancies.md` y en la baseline.
4. `npm test`. Si falla, tienes la discrepancia localizada con nombre y
   apellidos.
5. Corrige la fórmula, actualiza la fila correspondiente de `formulas.test.ts` y
   vuelve a correr `npm run glide:compare` para regenerar el informe.
