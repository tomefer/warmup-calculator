export type WarmupSet = {
  weight: number | string
  reps: string
}

export type WarmupResult = {
  sets: WarmupSet[]
  outOfRange: boolean
}

const roundTo2_5 = (x: number): number => Math.round(x / 2.5) * 2.5
const ceilTo2_5 = (x: number): number => Math.ceil(x / 2.5) * 2.5

/** Literales que la tabla pinta como texto en vez de como kilos. */
const TOO_LIGHT: WarmupResult = { sets: [{ weight: 'tooLight', reps: '' }], outOfRange: false }
const OUT_OF_RANGE: WarmupResult = { sets: [], outOfRange: true }

/** Por encima de este peso Glide no calcula: "¡Ya eres experto, calcúlalo tú!". */
const MAX_EFFECTIVE = 180

// ---------------------------------------------------------------------------
// Repeticiones
// ---------------------------------------------------------------------------

/**
 * Escalera de repeticiones.
 *
 * Glide no fija las reps por posición: las hace **descender hasta `x1` en la
 * última serie**, así que cuál sale en cada sitio depende de cuántas series
 * tenga el calentamiento. Cuando hay una serie menos, la que desaparece es la
 * de `x3`: sentadilla con cuatro series pasa de `x4` directamente a `x2`.
 *
 * Por eso las reps se aplican al final, con la lista de pesos ya cerrada, en
 * vez de escribirlas al construir cada serie.
 */
type RepLadder = Record<number, readonly string[]>

const SQUAT_REPS: RepLadder = {
  4: ['x5x2', 'x4', 'x2', 'x1'],
  5: ['x5x2', 'x4', 'x3', 'x2', 'x1'],
}

/** Igual que sentadilla, pero la serie base es `x5`: en Presses no se dobla. */
const PRESS_REPS: RepLadder = {
  4: ['x5', 'x4', 'x2', 'x1'],
  5: ['x5', 'x4', 'x3', 'x2', 'x1'],
}

const DEADLIFT_AFTER_SQUAT_REPS: RepLadder = {
  3: ['x5', 'x2', 'x1'],
  4: ['x5', 'x3', 'x2', 'x1'],
}

/** Siempre cinco series, con el RDL de barra vacía delante. */
const DEADLIFT_NO_SQUAT_REPS: RepLadder = {
  5: ['x8', 'x5', 'x4', 'x2', 'x1'],
}

function withReps(weights: (number | string)[], ladder: RepLadder): WarmupResult {
  const reps = ladder[weights.length]
  if (!reps) {
    throw new Error(
      `No hay escalera de repeticiones para ${weights.length} series: ` +
        `las definidas son ${Object.keys(ladder).join(', ')}.`
    )
  }
  return { sets: weights.map((weight, i) => ({ weight, reps: reps[i] })), outOfRange: false }
}

// ---------------------------------------------------------------------------
// Pesos
// ---------------------------------------------------------------------------

function calculateLastSet(effective: number, set0: number): number {
  if (effective <= 17.5) {
    return Math.max(ceilTo2_5(effective - 2.5), set0)
  } else if (effective <= 42.5) {
    return effective - 2.5
  } else if (effective <= 45) {
    return 40
  } else if (effective <= 62.5) {
    return effective - 5
  } else if (effective <= 87.5) {
    const rounded = roundTo2_5(0.9 * effective)
    return (effective - rounded <= 7.5) ? rounded : ceilTo2_5(0.9 * effective)
  } else if (effective <= 112.5) {
    const rounded = roundTo2_5(0.9 * effective)
    return (effective - rounded <= 10) ? rounded : ceilTo2_5(0.9 * effective)
  } else if (effective <= 137.5) {
    const rounded = roundTo2_5(0.9 * effective)
    return (effective - rounded <= 12.5) ? rounded : ceilTo2_5(0.9 * effective)
  } else {
    return ceilTo2_5(0.9 * effective)
  }
}

function getSquatPressBaseWeight(effective: number): number | null {
  if (effective >= 30) return 20
  if (effective >= 22.5) return 15
  if (effective >= 15) return 10
  if (effective >= 12.5) return 7.5
  if (effective >= 5) return 5
  return null
}

/**
 * Los pesos de sentadilla y press, que en Glide son **los mismos**: entre las
 * dos pestañas solo cambian las repeticiones de la primera serie.
 *
 * Devuelve `null` si el peso es tan bajo que no hay calentamiento que dar.
 */
function squatPressWeights(effective: number): number[] | null {
  const set0 = getSquatPressBaseWeight(effective)
  if (set0 === null) return null

  const weights: number[] = [set0]

  // Serie intermedia baja
  if (effective < 60) {
    weights.push(roundTo2_5(set0 + (0.9 * effective - set0) / 3))
  } else if (effective < 112.5) {
    weights.push(ceilTo2_5(0.5 * effective))
  } else {
    weights.push(60)
  }

  // Serie intermedia alta. Por encima de 60 kg es el 70 % topado a 100: el
  // tope solo entra en juego a partir de ~140 kg.
  if (effective < 60) {
    weights.push(roundTo2_5(set0 + (2 * (0.9 * effective - set0)) / 3))
  } else {
    weights.push(Math.min(ceilTo2_5(0.7 * effective), 100))
  }

  // Serie extra: a partir de 112.5 kg Glide mete una más, al 80 % topado a 140.
  if (effective >= 112.5) {
    weights.push(Math.min(ceilTo2_5(0.8 * effective), 140))
  }

  weights.push(calculateLastSet(effective, set0))

  return weights
}

export function calculateSquat(effective: number): WarmupResult {
  if (effective > MAX_EFFECTIVE) return OUT_OF_RANGE

  const weights = squatPressWeights(effective)
  if (weights === null) return TOO_LIGHT

  return withReps(weights, SQUAT_REPS)
}

/**
 * Press (militar o banca).
 *
 * Mismos pesos que sentadilla; lo único distinto es la serie base, que en la
 * pestaña de Presses es `x5` y no `x5x2` (sentadilla lleva ahí la nota al pie
 * "si no es el primer ejercicio, hacer sólo 1 serie").
 */
export function calculatePress(effective: number): WarmupResult {
  if (effective > MAX_EFFECTIVE) return OUT_OF_RANGE

  const weights = squatPressWeights(effective)
  if (weights === null) return TOO_LIGHT

  return withReps(weights, PRESS_REPS)
}

/**
 * Press cuando ya se ha hecho otro press antes (militar tras banca o al revés).
 *
 * Los pesos son exactamente los del press normal: lo único que cambia son las
 * repeticiones, porque ya se llega caliente. Aquí no hay escalera por número
 * de series —la segunda serie baja a `x2` y de ahí en adelante todo es `x1`—,
 * así que se deriva del press en lugar de duplicar las fórmulas.
 *
 *   press:  set0 x5 | set1 x4 | set2 x2 | [extra x2] | último x1
 *   previo: set0 x5 | set1 x2 | set2 x1 | [extra x1] | último x1
 */
export function calculatePressAfterPress(effective: number): WarmupResult {
  const base = calculatePress(effective)

  if (base.outOfRange) return base
  if (base.sets.some((s) => s.weight === 'tooLight')) return base

  const sets = base.sets.map((set, i) => ({
    weight: set.weight,
    reps: i === 0 ? 'x5' : i === 1 ? 'x2' : 'x1',
  }))

  return { sets, outOfRange: false }
}

function getDeadliftNoSquatBaseWeight(effective: number): number {
  if (effective >= 120) return 60
  if (effective >= 100) return 50
  if (effective >= 80) return 40
  if (effective >= 40) return 30
  if (effective >= 25) return 20
  return 15
}

export function calculateDeadliftNoSquat(effective: number): WarmupResult {
  if (effective > MAX_EFFECTIVE) return OUT_OF_RANGE
  if (effective < 15) return TOO_LIGHT

  const set0 = getDeadliftNoSquatBaseWeight(effective)

  // La primera es el RDL con la barra vacía, que este modo añade delante.
  const weights: (number | string)[] = ['rdlEmptyBar', set0]

  if (effective < 120) {
    weights.push(roundTo2_5(set0 + (0.9 * effective - set0) / 3))
    weights.push(roundTo2_5(set0 + (2 * (0.9 * effective - set0)) / 3))
  } else {
    weights.push(Math.min(ceilTo2_5(0.65 * effective), 100))
    weights.push(Math.min(ceilTo2_5(0.8 * effective), 140))
  }

  weights.push(calculateLastSet(effective, set0))

  return withReps(weights, DEADLIFT_NO_SQUAT_REPS)
}

function getDeadliftAfterSquatBaseWeight(effective: number): number {
  if (effective >= 100) return 60
  if (effective >= 55) return 40
  if (effective >= 40) return 30
  if (effective >= 25) return 20
  return 15
}

export function calculateDeadliftAfterSquat(effective: number): WarmupResult {
  if (effective > MAX_EFFECTIVE) return OUT_OF_RANGE
  if (effective < 15) return TOO_LIGHT

  const set0 = getDeadliftAfterSquatBaseWeight(effective)
  const weights: number[] = [set0]

  if (effective < 112.5) {
    weights.push(roundTo2_5(set0 + (0.9 * effective - set0) / 2))
  } else {
    weights.push(Math.min(ceilTo2_5(0.7 * effective), 100))
  }

  // Igual que en sentadilla, a partir de 112.5 kg aparece una serie más.
  if (effective >= 112.5) {
    weights.push(Math.min(ceilTo2_5(0.8 * effective), 140))
  }

  weights.push(calculateLastSet(effective, set0))

  return withReps(weights, DEADLIFT_AFTER_SQUAT_REPS)
}
