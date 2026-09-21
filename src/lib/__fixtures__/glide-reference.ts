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
  // Añade aquí los casos comprobados en la app de Glide.
]
