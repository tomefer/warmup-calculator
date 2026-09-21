import { describe, it, expect } from 'vitest'
import {
  calculateSquat,
  calculatePress,
  calculateDeadliftAfterSquat,
  calculateDeadliftNoSquat,
  type WarmupResult,
} from './formulas'

/**
 * Invariantes estructurales: propiedades que un calentamiento debe cumplir
 * sea cual sea la fórmula exacta. No dependen de los datos de Glide, así que
 * valen ya mismo para acorralar bugs.
 */

const STEP = 2.5
const MAX = 180

const sweep = (): number[] => {
  const out: number[] = []
  for (let w = STEP; w <= MAX; w += STEP) out.push(w)
  return out
}

const numericWeights = (r: WarmupResult): number[] =>
  r.sets.map((s) => s.weight).filter((x): x is number => typeof x === 'number')

const modes: [string, (w: number) => WarmupResult][] = [
  ['sentadilla', calculateSquat],
  ['press', calculatePress],
  ['peso muerto con sentadilla previa', calculateDeadliftAfterSquat],
  ['peso muerto sin sentadilla previa', calculateDeadliftNoSquat],
]

describe.each(modes)('%s', (_label, fn) => {
  it('nunca baja el peso entre series consecutivas', () => {
    const offenders = sweep().filter((w) => {
      const nums = numericWeights(fn(w))
      return nums.some((n, i) => i > 0 && n < nums[i - 1])
    })
    expect(offenders).toEqual([])
  })

  it('todos los pesos son múltiplos de 2.5 kg', () => {
    const offenders = sweep().filter((w) =>
      numericWeights(fn(w)).some((n) => Math.abs(n / 2.5 - Math.round(n / 2.5)) > 1e-9)
    )
    expect(offenders).toEqual([])
  })

  it('la última serie nunca supera el peso efectivo', () => {
    const offenders = sweep().filter((w) => {
      const nums = numericWeights(fn(w))
      return nums.length > 0 && nums[nums.length - 1] > w
    })
    expect(offenders).toEqual([])
  })

  it('rechaza pesos por encima de 180 kg', () => {
    expect(fn(182.5).outOfRange).toBe(true)
  })
})

/**
 * Series duplicadas consecutivas.
 *
 * Mostrar dos veces seguidas el mismo peso es, casi seguro, un bug: son las
 * listas de sospechosos para la paridad con Glide. Los tests fijan la lista
 * ACTUAL, así que al corregir una fórmula fallarán y habrá que recortarla.
 *
 * Lo que queda son duplicados benignos de pesos bajos: ahí las series chocan
 * contra el suelo de la barra y no hay sitio para escalonarlas. Glide hace lo
 * mismo (`deadliftAfterSquat@15` es `15 x5 | 15 x2 | 15 x1` en la captura).
 *
 * El duplicado que sí era un bug —sentadilla/press a partir de 112.5 kg, donde
 * `set2` y `set3` usaban la misma fórmula `min(ceil(0.8 × ef), 140)`— ya no
 * está: la serie de `x3` va al 70 % topado a 100.
 */
describe('series duplicadas consecutivas (bugs conocidos)', () => {
  const duplicatesFor = (fn: (w: number) => WarmupResult): number[] =>
    sweep().filter((w) => {
      const nums = numericWeights(fn(w))
      return nums.some((n, i) => i > 0 && n === nums[i - 1])
    })

  it('sentadilla / press: solo pesos bajos', () => {
    expect(duplicatesFor(calculateSquat)).toEqual([5, 7.5, 10, 12.5, 15, 17.5, 22.5])
  })

  it('peso muerto con sentadilla previa: solo pesos bajos', () => {
    expect(duplicatesFor(calculateDeadliftAfterSquat)).toEqual([15, 17.5, 20, 25])
  })

  it('peso muerto sin sentadilla previa: solo pesos bajos', () => {
    expect(duplicatesFor(calculateDeadliftNoSquat)).toEqual([
      15, 17.5, 20, 22.5, 25, 27.5,
    ])
  })
})
