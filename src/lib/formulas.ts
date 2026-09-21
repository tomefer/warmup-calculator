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

export function calculateSquatPress(effective: number): WarmupResult {
  if (effective > 180) {
    return { sets: [], outOfRange: true }
  }

  const set0 = getSquatPressBaseWeight(effective)
  if (set0 === null) {
    return { sets: [{ weight: 'tooLight', reps: '' }], outOfRange: false }
  }

  const sets: WarmupSet[] = []
  sets.push({ weight: set0, reps: 'x5x2' })

  // Set 1 (x4)
  let set1: number
  if (effective < 60) {
    set1 = roundTo2_5(set0 + (0.9 * effective - set0) / 3)
  } else if (effective < 112.5) {
    set1 = ceilTo2_5(0.5 * effective)
  } else {
    set1 = 60
  }
  sets.push({ weight: set1, reps: 'x4' })

  // Set 2 (x3)
  let set2: number
  if (effective < 60) {
    set2 = roundTo2_5(set0 + 2 * (0.9 * effective - set0) / 3)
  } else if (effective < 112.5) {
    set2 = ceilTo2_5(0.7 * effective)
  } else {
    set2 = Math.min(ceilTo2_5(0.8 * effective), 140)
  }
  sets.push({ weight: set2, reps: 'x3' })

  // Set 3 (x2) - only if effective >= 112.5
  if (effective >= 112.5) {
    const set3 = Math.min(ceilTo2_5(0.8 * effective), 140)
    sets.push({ weight: set3, reps: 'x2' })
  }

  // Last set (x1)
  const lastSet = calculateLastSet(effective, set0)
  sets.push({ weight: lastSet, reps: 'x1' })

  return { sets, outOfRange: false }
}

/**
 * Press cuando ya se ha hecho otro press antes (militar tras banca o al revés).
 *
 * Los pesos son exactamente los del press normal: lo único que cambia son las
 * repeticiones, porque ya se llega caliente. La serie base baja de dos series
 * de 5 a una sola, y las de arriba pasan a 2, 1 y 1.
 *
 *   normal:  set0 x5x2 | set1 x4 | set2 x3 | [set3 x2] | último x1
 *   previo:  set0 x5   | set1 x2 | set2 x1 | [set3 x1] | último x1
 *
 * Se deriva del press normal en lugar de duplicar las fórmulas, para que
 * cualquier corrección de pesos valga para los dos modos a la vez.
 */
export function calculatePressAfterPress(effective: number): WarmupResult {
  const base = calculateSquatPress(effective)

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
  if (effective > 180) {
    return { sets: [], outOfRange: true }
  }

  if (effective < 15) {
    return { sets: [{ weight: 'tooLight', reps: '' }], outOfRange: false }
  }

  const sets: WarmupSet[] = []

  // Set -1: RDL with empty bar
  sets.push({ weight: 'rdlEmptyBar', reps: 'x8' })

  // Set 0 (x5)
  const set0 = getDeadliftNoSquatBaseWeight(effective)
  sets.push({ weight: set0, reps: 'x5' })

  // Set 1 (x4)
  let set1: number
  if (effective < 120) {
    set1 = roundTo2_5(set0 + (0.9 * effective - set0) / 3)
  } else {
    set1 = Math.min(ceilTo2_5(0.65 * effective), 100)
  }
  sets.push({ weight: set1, reps: 'x4' })

  // Set 2 (x2)
  let set2: number
  if (effective < 120) {
    set2 = roundTo2_5(set0 + 2 * (0.9 * effective - set0) / 3)
  } else {
    set2 = Math.min(ceilTo2_5(0.8 * effective), 140)
  }
  sets.push({ weight: set2, reps: 'x2' })

  // Last set (x1)
  const lastSet = calculateLastSet(effective, set0)
  sets.push({ weight: lastSet, reps: 'x1' })

  return { sets, outOfRange: false }
}

function getDeadliftAfterSquatBaseWeight(effective: number): number {
  if (effective >= 100) return 60
  if (effective >= 55) return 40
  if (effective >= 40) return 30
  if (effective >= 25) return 20
  return 15
}

export function calculateDeadliftAfterSquat(effective: number): WarmupResult {
  if (effective > 180) {
    return { sets: [], outOfRange: true }
  }

  if (effective < 15) {
    return { sets: [{ weight: 'tooLight', reps: '' }], outOfRange: false }
  }

  const sets: WarmupSet[] = []

  // Set 0 (x5)
  const set0 = getDeadliftAfterSquatBaseWeight(effective)
  sets.push({ weight: set0, reps: 'x5' })

  // Set 1 (x3)
  let set1: number
  if (effective < 112.5) {
    set1 = roundTo2_5(set0 + (0.9 * effective - set0) / 2)
  } else {
    set1 = Math.min(ceilTo2_5(0.7 * effective), 100)
  }
  sets.push({ weight: set1, reps: 'x3' })

  // Set 2 (x1) - only for effective >= 112.5
  if (effective >= 112.5) {
    const set2 = Math.min(ceilTo2_5(0.8 * effective), 140)
    sets.push({ weight: set2, reps: 'x1' })
  }

  // Last set (x1)
  const lastSet = calculateLastSet(effective, set0)
  sets.push({ weight: lastSet, reps: 'x1' })

  return { sets, outOfRange: false }
}
