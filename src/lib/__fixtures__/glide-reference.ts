/**
 * Valores de referencia de la app ORIGINAL de Glide.
 *
 * Esta es la fuente de verdad para la paridad de fórmulas. Cada entrada es un
 * caso que has comprobado a mano en la app de Glide.
 *
 * ── Cómo añadir un caso ──────────────────────────────────────────────────
 * 1. Abre la app de Glide, elige el ejercicio y el modo.
 * 2. Introduce un peso efectivo.
 * 3. Copia las series que muestra, en orden, con este formato:
 *
 *      'peso reps | peso reps | ...'
 *
 *    - El peso es un número en kg, o uno de los literales especiales
 *      `rdlEmptyBar` (RDL con barra vacía) y `tooLight`.
 *    - Las reps se escriben como las devuelve `formulas.ts`: `x5x2`, `x4`,
 *      `x3`, `x2`, `x1`, `x8`. Para `tooLight` no hay reps: usa solo
 *      `'tooLight'`.
 *    - Si la app original rechaza el peso por pasarse, usa `'OUT_OF_RANGE'`.
 *
 * 4. Añade la fila al array de abajo.
 *
 * Ejemplo:
 *      { mode: 'squat', effective: 100, expected: '20 x5x2 | 50 x4 | 70 x3 | 90 x1' },
 *
 * No hace falta llenarlo entero de golpe: `glide-parity.test.ts` comprueba
 * solo lo que haya aquí. Cada fila que añadas convierte una sospecha del
 * README en un test que pasa o falla.
 *
 * ── Procedencia de los casos actuales ────────────────────────────────────
 * Capturados el 2026-09-21 de https://warmup-calculator.glide.page/,
 * introduciendo cada peso en el campo "Introduce el peso de la serie
 * efectiva:" y leyendo la tabla "Series de calentamiento:" tal cual.
 *
 * Notas de transcripción:
 *  - Glide muestra los pesos con coma y a veces con dos decimales ("60,00",
 *    "112,50") y a veces sin ellos ("55", "127,5"). Es inconsistencia de
 *    presentación del original: aquí se normaliza al número (60, 112.5).
 *  - En Sentadilla la primera serie se muestra como "x5x2*", con la nota
 *    "*Si no es el primer ejercicio, hacer sólo 1 serie". El asterisco es la
 *    llamada a la nota, no parte de las reps.
 *  - En Presses esa misma primera serie se muestra como "x5" (una sola
 *    serie) y sin nota al pie.
 *  - Por encima de 180 kg la app no calcula: muestra "¡Ya eres experto,
 *    calcúlalo tú! 😉" → `OUT_OF_RANGE`.
 *  - La pantalla "Dale aquí" de Presses NO pide el peso del press anterior:
 *    solo recorta las repeticiones sobre los mismos pesos. Por eso ningún
 *    caso de `pressAfterPress` usa `previous`.
 */

export type GlideMode =
  | 'squat'
  | 'press'
  | 'pressAfterPress'
  | 'deadliftAfterSquat'
  | 'deadliftNoSquat'

export type GlideCase = {
  mode: GlideMode
  /** Peso de la serie efectiva, en kg. */
  effective: number
  /**
   * Solo para `pressAfterPress`: el peso del press que ya se ha hecho antes.
   * Se ignora en los demás modos.
   */
  previous?: number
  /** Series que muestra la app de Glide, en orden. */
  expected: string
  /** Nota opcional: de dónde salió el dato, capturas, dudas. */
  note?: string
}

export const glideCases: GlideCase[] = [
  // ── Sentadilla (SQ) ────────────────────────────────────────────────────
  { mode: 'squat', effective: 15, expected: '10 x5x2 | 10 x4 | 12.5 x2 | 12.5 x1' },
  { mode: 'squat', effective: 20, expected: '10 x5x2 | 12.5 x4 | 15 x2 | 17.5 x1' },
  { mode: 'squat', effective: 30, expected: '20 x5x2 | 22.5 x4 | 25 x2 | 27.5 x1' },
  { mode: 'squat', effective: 40, expected: '20 x5x2 | 25 x4 | 30 x2 | 37.5 x1' },
  { mode: 'squat', effective: 50, expected: '20 x5x2 | 27.5 x4 | 37.5 x2 | 45 x1' },
  { mode: 'squat', effective: 60, expected: '20 x5x2 | 30 x4 | 42.5 x2 | 55 x1' },
  { mode: 'squat', effective: 70, expected: '20 x5x2 | 35 x4 | 50 x2 | 62.5 x1' },
  { mode: 'squat', effective: 80, expected: '20 x5x2 | 40 x4 | 57.5 x2 | 72.5 x1' },
  { mode: 'squat', effective: 100, expected: '20 x5x2 | 50 x4 | 70 x2 | 90 x1' },
  {
    mode: 'squat',
    effective: 112.5,
    expected: '20 x5x2 | 60 x4 | 80 x3 | 90 x2 | 102.5 x1',
    note: 'Umbral: a partir de 112,5 aparece una serie más (5 en vez de 4).',
  },
  { mode: 'squat', effective: 140, expected: '20 x5x2 | 60 x4 | 100 x3 | 112.5 x2 | 127.5 x1' },
  { mode: 'squat', effective: 180, expected: '20 x5x2 | 60 x4 | 100 x3 | 140 x2 | 162.5 x1' },
  {
    mode: 'squat',
    effective: 185,
    expected: 'OUT_OF_RANGE',
    note: '"¡Ya eres experto, calcúlalo tú! 😉". El corte está en 180 kg.',
  },

  // ── Presses (P, BP) ────────────────────────────────────────────────────
  { mode: 'press', effective: 15, expected: '10 x5 | 10 x4 | 12.5 x2 | 12.5 x1' },
  { mode: 'press', effective: 20, expected: '10 x5 | 12.5 x4 | 15 x2 | 17.5 x1' },
  { mode: 'press', effective: 40, expected: '20 x5 | 25 x4 | 30 x2 | 37.5 x1' },
  { mode: 'press', effective: 60, expected: '20 x5 | 30 x4 | 42.5 x2 | 55 x1' },
  { mode: 'press', effective: 100, expected: '20 x5 | 50 x4 | 70 x2 | 90 x1' },
  {
    mode: 'press',
    effective: 140,
    expected: '20 x5 | 60 x4 | 100 x3 | 112.5 x2 | 127.5 x1',
    note: 'Mismos pesos que Sentadilla; solo cambia la primera serie (x5, no x5x2).',
  },

  // ── Presses → "Dale aquí" (si vienes de banca o press) ─────────────────
  { mode: 'pressAfterPress', effective: 15, expected: '10 x5 | 10 x2 | 12.5 x1 | 12.5 x1' },
  { mode: 'pressAfterPress', effective: 60, expected: '20 x5 | 30 x2 | 42.5 x1 | 55 x1' },
  { mode: 'pressAfterPress', effective: 100, expected: '20 x5 | 50 x2 | 70 x1 | 90 x1' },
  {
    mode: 'pressAfterPress',
    effective: 140,
    expected: '20 x5 | 60 x2 | 100 x1 | 112.5 x1 | 127.5 x1',
    note: 'Mismos pesos que Presses normal, con las reps recortadas.',
  },

  // ── Peso Muerto (DL), pantalla por defecto (ya has hecho sentadillas) ──
  { mode: 'deadliftAfterSquat', effective: 15, expected: '15 x5 | 15 x2 | 15 x1' },
  { mode: 'deadliftAfterSquat', effective: 60, expected: '40 x5 | 47.5 x2 | 55 x1' },
  { mode: 'deadliftAfterSquat', effective: 100, expected: '60 x5 | 75 x2 | 90 x1' },
  {
    mode: 'deadliftAfterSquat',
    effective: 140,
    expected: '60 x5 | 100 x3 | 112.5 x2 | 127.5 x1',
    note: 'Hasta 112,5 son 3 series; por encima aparece una cuarta.',
  },
  { mode: 'deadliftAfterSquat', effective: 185, expected: 'OUT_OF_RANGE' },

  // ── Peso Muerto → "Dale aquí" (si NO has hecho sentadillas) ────────────
  {
    mode: 'deadliftNoSquat',
    effective: 15,
    expected: 'rdlEmptyBar x8 | 15 x5 | 15 x4 | 15 x2 | 15 x1',
    note: 'Este modo añade delante "RDL con barra vacía" a 8 reps.',
  },
  { mode: 'deadliftNoSquat', effective: 60, expected: 'rdlEmptyBar x8 | 30 x5 | 37.5 x4 | 45 x2 | 55 x1' },
  { mode: 'deadliftNoSquat', effective: 100, expected: 'rdlEmptyBar x8 | 50 x5 | 62.5 x4 | 77.5 x2 | 90 x1' },
  { mode: 'deadliftNoSquat', effective: 140, expected: 'rdlEmptyBar x8 | 60 x5 | 92.5 x4 | 112.5 x2 | 127.5 x1' },
]
