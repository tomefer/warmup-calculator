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

Las fórmulas de cálculo se extrajeron directamente del JSON de configuración de la app Glide original. Sin embargo, **hay discrepancias entre los resultados de ambas apps** que aún no hemos podido identificar del todo.

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
- Serie 1 (×4): interpolación 1/3 entre set0 y el 90% del efectivo, redondeada a 2.5 kg
- Serie 2 (×3): interpolación 2/3 entre set0 y el 90% del efectivo, redondeada a 2.5 kg
- Serie 3 (×2): solo si efectivo ≥ 112.5 kg → `MIN(CEILING(0.8 × ef / 2.5) × 2.5, 140)`

**Serie última (×1):**
Aproximación al 90% del efectivo con redondeo fino según tramos.

#### Peso muerto sin sentadilla previa

Añade una serie -1 de "RDL con barra vacía" (×8). El peso base es más alto que en sentadilla. Las intermedias interpolan igual pero con umbrales distintos.

#### Peso muerto con sentadilla previa

El peso base es menor (la sentadilla ya ha calentado). Solo 2 series intermedias antes de la última.

### ⚠️ Discrepancias conocidas

Los resultados de nuestra app y la app original de Glide no coinciden en todos los casos. Sospechamos que puede ser por:

1. El orden exacto de redondeo en las series intermedias
2. Los umbrales de tramos de la serie última
3. La lógica del modo "press con press previo" (aún sin implementar correctamente)
4. La lógica del modo "peso muerto con sentadilla previa" en pesos altos

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

Para cazar las discrepancias con Glide: genera el CSV, exporta lo mismo de la app original y haz un `diff` de las dos columnas de series.

Requiere Node 22.18+ o 24+ (el script es TypeScript y lo ejecuta Node directamente, sin dependencias extra).

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
