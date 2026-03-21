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
