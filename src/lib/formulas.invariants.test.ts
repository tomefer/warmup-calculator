import { describe, it, expect } from 'vitest'
import {
  calculateSquatPress,
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
  ['sentadilla / press', calculateSquatPress],
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
 * El caso gordo es sentadilla/press a partir de 112.5 kg: ahí `set2` y `set3`
 * usan exactamente la misma fórmula — `min(ceil(0.8 × ef), 140)` — en
 * `formulas.ts`, así que salen siempre iguales. Es el primer sitio donde
 * mirar. En pesos bajos los duplicados son más benignos (suelo de la barra).
 */
describe('series duplicadas consecutivas (bugs conocidos)', () => {
  const duplicatesFor = (fn: (w: number) => WarmupResult): number[] =>
    sweep().filter((w) => {
      const nums = numericWeights(fn(w))
      return nums.some((n, i) => i > 0 && n === nums[i - 1])
    })

  it('sentadilla / press: duplica en todo el rango alto (≥ 112.5 kg)', () => {
    expect(duplicatesFor(calculateSquatPress)).toEqual([
      5, 7.5, 10, 12.5, 15, 17.5, 22.5, 112.5, 115, 117.5, 120, 122.5, 125,
      127.5, 130, 132.5, 135, 137.5, 140, 142.5, 145, 147.5, 150, 152.5, 155,
      157.5, 160, 162.5, 165, 167.5, 170, 172.5, 175, 177.5, 180,
    ])
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
