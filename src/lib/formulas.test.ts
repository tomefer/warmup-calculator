import { describe, it, expect } from 'vitest'
import {
  calculateSquat,
  calculatePress,
  calculatePressAfterPress,
  calculateDeadliftAfterSquat,
  calculateDeadliftNoSquat,
  type WarmupResult,
} from './formulas'

/**
 * Tests de caracterización.
 *
 * Estas tablas registran lo que la app hace HOY: sirven de red de seguridad
 * para refactorizar sin cambiar resultados sin querer. Los pesos capturados de
 * Glide son un subconjunto de estas filas; el resto son interpolaciones de
 * nuestras fórmulas, todavía sin comprobar contra la app original.
 *
 * La verdad (lo que muestra la app de Glide) está en
 * `reference/glide-results.csv`, y la comprueba `glide-parity.test.ts`. Cuando
 * un caso de paridad falle y corrijas la fórmula, actualiza también la fila
 * correspondiente de aquí.
 */

const format = (r: WarmupResult): string =>
  r.outOfRange
    ? 'OUT_OF_RANGE'
    : r.sets.map((s) => `${s.weight}${s.reps ? ' ' + s.reps : ''}`).join(' | ')

describe('sentadilla', () => {
  const cases: [number, string][] = [
    [2.5, 'tooLight'],
    [5, '5 x5x2 | 5 x4 | 5 x2 | 5 x1'],
    [7.5, '5 x5x2 | 5 x4 | 5 x2 | 5 x1'],
    [10, '5 x5x2 | 7.5 x4 | 7.5 x2 | 7.5 x1'],
    [12.5, '7.5 x5x2 | 10 x4 | 10 x2 | 10 x1'],
    [15, '10 x5x2 | 10 x4 | 12.5 x2 | 12.5 x1'],
    [17.5, '10 x5x2 | 12.5 x4 | 15 x2 | 15 x1'],
    [20, '10 x5x2 | 12.5 x4 | 15 x2 | 17.5 x1'],
    [22.5, '15 x5x2 | 17.5 x4 | 17.5 x2 | 20 x1'],
    [25, '15 x5x2 | 17.5 x4 | 20 x2 | 22.5 x1'],
    [30, '20 x5x2 | 22.5 x4 | 25 x2 | 27.5 x1'],
    [40, '20 x5x2 | 25 x4 | 30 x2 | 37.5 x1'],
    [42.5, '20 x5x2 | 25 x4 | 32.5 x2 | 40 x1'],
    [45, '20 x5x2 | 27.5 x4 | 32.5 x2 | 40 x1'],
    [50, '20 x5x2 | 27.5 x4 | 37.5 x2 | 45 x1'],
    [55, '20 x5x2 | 30 x4 | 40 x2 | 50 x1'],
    [60, '20 x5x2 | 30 x4 | 42.5 x2 | 55 x1'],
    [62.5, '20 x5x2 | 32.5 x4 | 45 x2 | 57.5 x1'],
    [70, '20 x5x2 | 35 x4 | 50 x2 | 62.5 x1'],
    [80, '20 x5x2 | 40 x4 | 57.5 x2 | 72.5 x1'],
    [87.5, '20 x5x2 | 45 x4 | 62.5 x2 | 80 x1'],
    [90, '20 x5x2 | 45 x4 | 65 x2 | 80 x1'],
    [100, '20 x5x2 | 50 x4 | 70 x2 | 90 x1'],
    [110, '20 x5x2 | 55 x4 | 77.5 x2 | 100 x1'],
    [112.5, '20 x5x2 | 60 x4 | 80 x3 | 90 x2 | 102.5 x1'],
    [120, '20 x5x2 | 60 x4 | 85 x3 | 97.5 x2 | 107.5 x1'],
    [130, '20 x5x2 | 60 x4 | 92.5 x3 | 105 x2 | 117.5 x1'],
    [137.5, '20 x5x2 | 60 x4 | 97.5 x3 | 110 x2 | 125 x1'],
    [140, '20 x5x2 | 60 x4 | 100 x3 | 112.5 x2 | 127.5 x1'],
    [150, '20 x5x2 | 60 x4 | 100 x3 | 120 x2 | 135 x1'],
    [160, '20 x5x2 | 60 x4 | 100 x3 | 130 x2 | 145 x1'],
    [170, '20 x5x2 | 60 x4 | 100 x3 | 137.5 x2 | 155 x1'],
    [180, '20 x5x2 | 60 x4 | 100 x3 | 140 x2 | 162.5 x1'],
    [182.5, 'OUT_OF_RANGE'],
  ]

  it.each(cases)('%d kg', (effective, expected) => {
    expect(format(calculateSquat(effective))).toBe(expected)
  })
})

describe('press', () => {
  const cases: [number, string][] = [
    [2.5, 'tooLight'],
    [5, '5 x5 | 5 x4 | 5 x2 | 5 x1'],
    [7.5, '5 x5 | 5 x4 | 5 x2 | 5 x1'],
    [10, '5 x5 | 7.5 x4 | 7.5 x2 | 7.5 x1'],
    [12.5, '7.5 x5 | 10 x4 | 10 x2 | 10 x1'],
    [15, '10 x5 | 10 x4 | 12.5 x2 | 12.5 x1'],
    [17.5, '10 x5 | 12.5 x4 | 15 x2 | 15 x1'],
    [20, '10 x5 | 12.5 x4 | 15 x2 | 17.5 x1'],
    [22.5, '15 x5 | 17.5 x4 | 17.5 x2 | 20 x1'],
    [25, '15 x5 | 17.5 x4 | 20 x2 | 22.5 x1'],
    [30, '20 x5 | 22.5 x4 | 25 x2 | 27.5 x1'],
    [40, '20 x5 | 25 x4 | 30 x2 | 37.5 x1'],
    [42.5, '20 x5 | 25 x4 | 32.5 x2 | 40 x1'],
    [45, '20 x5 | 27.5 x4 | 32.5 x2 | 40 x1'],
    [50, '20 x5 | 27.5 x4 | 37.5 x2 | 45 x1'],
    [55, '20 x5 | 30 x4 | 40 x2 | 50 x1'],
    [60, '20 x5 | 30 x4 | 42.5 x2 | 55 x1'],
    [62.5, '20 x5 | 32.5 x4 | 45 x2 | 57.5 x1'],
    [70, '20 x5 | 35 x4 | 50 x2 | 62.5 x1'],
    [80, '20 x5 | 40 x4 | 57.5 x2 | 72.5 x1'],
    [87.5, '20 x5 | 45 x4 | 62.5 x2 | 80 x1'],
    [90, '20 x5 | 45 x4 | 65 x2 | 80 x1'],
    [100, '20 x5 | 50 x4 | 70 x2 | 90 x1'],
    [110, '20 x5 | 55 x4 | 77.5 x2 | 100 x1'],
    [112.5, '20 x5 | 60 x4 | 80 x3 | 90 x2 | 102.5 x1'],
    [120, '20 x5 | 60 x4 | 85 x3 | 97.5 x2 | 107.5 x1'],
    [130, '20 x5 | 60 x4 | 92.5 x3 | 105 x2 | 117.5 x1'],
    [137.5, '20 x5 | 60 x4 | 97.5 x3 | 110 x2 | 125 x1'],
    [140, '20 x5 | 60 x4 | 100 x3 | 112.5 x2 | 127.5 x1'],
    [150, '20 x5 | 60 x4 | 100 x3 | 120 x2 | 135 x1'],
    [160, '20 x5 | 60 x4 | 100 x3 | 130 x2 | 145 x1'],
    [170, '20 x5 | 60 x4 | 100 x3 | 137.5 x2 | 155 x1'],
    [180, '20 x5 | 60 x4 | 100 x3 | 140 x2 | 162.5 x1'],
    [182.5, 'OUT_OF_RANGE'],
  ]

  it.each(cases)('%d kg', (effective, expected) => {
    expect(format(calculatePress(effective))).toBe(expected)
  })

  it('usa exactamente los mismos pesos que la sentadilla', () => {
    for (let w = 5; w <= 180; w += 2.5) {
      expect(calculatePress(w).sets.map((s) => s.weight)).toEqual(
        calculateSquat(w).sets.map((s) => s.weight)
      )
    }
  })

  it('solo cambia la serie base: x5 en vez de x5x2', () => {
    for (let w = 5; w <= 180; w += 2.5) {
      const press = calculatePress(w).sets.map((s) => s.reps)
      const squat = calculateSquat(w).sets.map((s) => s.reps)
      expect(press[0]).toBe('x5')
      expect(squat[0]).toBe('x5x2')
      expect(press.slice(1)).toEqual(squat.slice(1))
    }
  })
})

describe('peso muerto con sentadilla previa', () => {
  const cases: [number, string][] = [
    [2.5, 'tooLight'],
    [5, 'tooLight'],
    [7.5, 'tooLight'],
    [10, 'tooLight'],
    [12.5, 'tooLight'],
    [15, '15 x5 | 15 x2 | 15 x1'],
    [17.5, '15 x5 | 15 x2 | 15 x1'],
    [20, '15 x5 | 17.5 x2 | 17.5 x1'],
    [22.5, '15 x5 | 17.5 x2 | 20 x1'],
    [25, '20 x5 | 22.5 x2 | 22.5 x1'],
    [30, '20 x5 | 22.5 x2 | 27.5 x1'],
    [40, '30 x5 | 32.5 x2 | 37.5 x1'],
    [42.5, '30 x5 | 35 x2 | 40 x1'],
    [45, '30 x5 | 35 x2 | 40 x1'],
    [50, '30 x5 | 37.5 x2 | 45 x1'],
    [55, '40 x5 | 45 x2 | 50 x1'],
    [60, '40 x5 | 47.5 x2 | 55 x1'],
    [62.5, '40 x5 | 47.5 x2 | 57.5 x1'],
    [70, '40 x5 | 52.5 x2 | 62.5 x1'],
    [80, '40 x5 | 55 x2 | 72.5 x1'],
    [87.5, '40 x5 | 60 x2 | 80 x1'],
    [90, '40 x5 | 60 x2 | 80 x1'],
    [100, '60 x5 | 75 x2 | 90 x1'],
    [110, '60 x5 | 80 x2 | 100 x1'],
    [112.5, '60 x5 | 80 x3 | 90 x2 | 102.5 x1'],
    [120, '60 x5 | 85 x3 | 97.5 x2 | 107.5 x1'],
    [130, '60 x5 | 92.5 x3 | 105 x2 | 117.5 x1'],
    [137.5, '60 x5 | 97.5 x3 | 110 x2 | 125 x1'],
    [140, '60 x5 | 100 x3 | 112.5 x2 | 127.5 x1'],
    [150, '60 x5 | 100 x3 | 120 x2 | 135 x1'],
    [160, '60 x5 | 100 x3 | 130 x2 | 145 x1'],
    [170, '60 x5 | 100 x3 | 137.5 x2 | 155 x1'],
    [180, '60 x5 | 100 x3 | 140 x2 | 162.5 x1'],
    [182.5, 'OUT_OF_RANGE'],
  ]

  it.each(cases)('%d kg', (effective, expected) => {
    expect(format(calculateDeadliftAfterSquat(effective))).toBe(expected)
  })
})

describe('peso muerto sin sentadilla previa', () => {
  const cases: [number, string][] = [
    [2.5, 'tooLight'],
    [5, 'tooLight'],
    [7.5, 'tooLight'],
    [10, 'tooLight'],
    [12.5, 'tooLight'],
    [15, 'rdlEmptyBar x8 | 15 x5 | 15 x4 | 15 x2 | 15 x1'],
    [17.5, 'rdlEmptyBar x8 | 15 x5 | 15 x4 | 15 x2 | 15 x1'],
    [20, 'rdlEmptyBar x8 | 15 x5 | 15 x4 | 17.5 x2 | 17.5 x1'],
    [22.5, 'rdlEmptyBar x8 | 15 x5 | 17.5 x4 | 17.5 x2 | 20 x1'],
    [25, 'rdlEmptyBar x8 | 20 x5 | 20 x4 | 22.5 x2 | 22.5 x1'],
    [30, 'rdlEmptyBar x8 | 20 x5 | 22.5 x4 | 25 x2 | 27.5 x1'],
    [40, 'rdlEmptyBar x8 | 30 x5 | 32.5 x4 | 35 x2 | 37.5 x1'],
    [42.5, 'rdlEmptyBar x8 | 30 x5 | 32.5 x4 | 35 x2 | 40 x1'],
    [45, 'rdlEmptyBar x8 | 30 x5 | 32.5 x4 | 37.5 x2 | 40 x1'],
    [50, 'rdlEmptyBar x8 | 30 x5 | 35 x4 | 40 x2 | 45 x1'],
    [55, 'rdlEmptyBar x8 | 30 x5 | 37.5 x4 | 42.5 x2 | 50 x1'],
    [60, 'rdlEmptyBar x8 | 30 x5 | 37.5 x4 | 45 x2 | 55 x1'],
    [62.5, 'rdlEmptyBar x8 | 30 x5 | 40 x4 | 47.5 x2 | 57.5 x1'],
    [70, 'rdlEmptyBar x8 | 30 x5 | 40 x4 | 52.5 x2 | 62.5 x1'],
    [80, 'rdlEmptyBar x8 | 40 x5 | 50 x4 | 62.5 x2 | 72.5 x1'],
    [87.5, 'rdlEmptyBar x8 | 40 x5 | 52.5 x4 | 65 x2 | 80 x1'],
    [90, 'rdlEmptyBar x8 | 40 x5 | 52.5 x4 | 67.5 x2 | 80 x1'],
    [100, 'rdlEmptyBar x8 | 50 x5 | 62.5 x4 | 77.5 x2 | 90 x1'],
    [110, 'rdlEmptyBar x8 | 50 x5 | 67.5 x4 | 82.5 x2 | 100 x1'],
    [112.5, 'rdlEmptyBar x8 | 50 x5 | 67.5 x4 | 85 x2 | 102.5 x1'],
    [120, 'rdlEmptyBar x8 | 60 x5 | 80 x4 | 97.5 x2 | 107.5 x1'],
    [130, 'rdlEmptyBar x8 | 60 x5 | 85 x4 | 105 x2 | 117.5 x1'],
    [137.5, 'rdlEmptyBar x8 | 60 x5 | 90 x4 | 110 x2 | 125 x1'],
    [140, 'rdlEmptyBar x8 | 60 x5 | 92.5 x4 | 112.5 x2 | 127.5 x1'],
    [150, 'rdlEmptyBar x8 | 60 x5 | 97.5 x4 | 120 x2 | 135 x1'],
    [160, 'rdlEmptyBar x8 | 60 x5 | 100 x4 | 130 x2 | 145 x1'],
    [170, 'rdlEmptyBar x8 | 60 x5 | 100 x4 | 137.5 x2 | 155 x1'],
    [180, 'rdlEmptyBar x8 | 60 x5 | 100 x4 | 140 x2 | 162.5 x1'],
    [182.5, 'OUT_OF_RANGE'],
  ]

  it.each(cases)('%d kg', (effective, expected) => {
    expect(format(calculateDeadliftNoSquat(effective))).toBe(expected)
  })
})

describe('press con press previo', () => {
  const cases: [number, string][] = [
    [2.5, 'tooLight'],
    [5, '5 x5 | 5 x2 | 5 x1 | 5 x1'],
    [7.5, '5 x5 | 5 x2 | 5 x1 | 5 x1'],
    [10, '5 x5 | 7.5 x2 | 7.5 x1 | 7.5 x1'],
    [12.5, '7.5 x5 | 10 x2 | 10 x1 | 10 x1'],
    [15, '10 x5 | 10 x2 | 12.5 x1 | 12.5 x1'],
    [17.5, '10 x5 | 12.5 x2 | 15 x1 | 15 x1'],
    [20, '10 x5 | 12.5 x2 | 15 x1 | 17.5 x1'],
    [22.5, '15 x5 | 17.5 x2 | 17.5 x1 | 20 x1'],
    [25, '15 x5 | 17.5 x2 | 20 x1 | 22.5 x1'],
    [30, '20 x5 | 22.5 x2 | 25 x1 | 27.5 x1'],
    [40, '20 x5 | 25 x2 | 30 x1 | 37.5 x1'],
    [42.5, '20 x5 | 25 x2 | 32.5 x1 | 40 x1'],
    [45, '20 x5 | 27.5 x2 | 32.5 x1 | 40 x1'],
    [50, '20 x5 | 27.5 x2 | 37.5 x1 | 45 x1'],
    [55, '20 x5 | 30 x2 | 40 x1 | 50 x1'],
    [60, '20 x5 | 30 x2 | 42.5 x1 | 55 x1'],
    [62.5, '20 x5 | 32.5 x2 | 45 x1 | 57.5 x1'],
    [70, '20 x5 | 35 x2 | 50 x1 | 62.5 x1'],
    [80, '20 x5 | 40 x2 | 57.5 x1 | 72.5 x1'],
    [87.5, '20 x5 | 45 x2 | 62.5 x1 | 80 x1'],
    [90, '20 x5 | 45 x2 | 65 x1 | 80 x1'],
    [100, '20 x5 | 50 x2 | 70 x1 | 90 x1'],
    [110, '20 x5 | 55 x2 | 77.5 x1 | 100 x1'],
    [112.5, '20 x5 | 60 x2 | 80 x1 | 90 x1 | 102.5 x1'],
    [120, '20 x5 | 60 x2 | 85 x1 | 97.5 x1 | 107.5 x1'],
    [130, '20 x5 | 60 x2 | 92.5 x1 | 105 x1 | 117.5 x1'],
    [137.5, '20 x5 | 60 x2 | 97.5 x1 | 110 x1 | 125 x1'],
    [140, '20 x5 | 60 x2 | 100 x1 | 112.5 x1 | 127.5 x1'],
    [150, '20 x5 | 60 x2 | 100 x1 | 120 x1 | 135 x1'],
    [160, '20 x5 | 60 x2 | 100 x1 | 130 x1 | 145 x1'],
    [170, '20 x5 | 60 x2 | 100 x1 | 137.5 x1 | 155 x1'],
    [180, '20 x5 | 60 x2 | 100 x1 | 140 x1 | 162.5 x1'],
    [182.5, 'OUT_OF_RANGE'],
  ]

  it.each(cases)('%d kg', (effective, expected) => {
    expect(format(calculatePressAfterPress(effective))).toBe(expected)
  })

  it('usa exactamente los mismos pesos que el press normal', () => {
    for (let w = 5; w <= 180; w += 2.5) {
      expect(calculatePressAfterPress(w).sets.map((s) => s.weight)).toEqual(
        calculatePress(w).sets.map((s) => s.weight)
      )
    }
  })

  it('reduce las repeticiones a 5, 2, 1, 1...', () => {
    expect(calculatePressAfterPress(60).sets.map((s) => s.reps)).toEqual([
      'x5', 'x2', 'x1', 'x1',
    ])
    expect(calculatePressAfterPress(120).sets.map((s) => s.reps)).toEqual([
      'x5', 'x2', 'x1', 'x1', 'x1',
    ])
  })

  it('hereda los casos límite del press normal', () => {
    expect(calculatePressAfterPress(2.5).sets[0].weight).toBe('tooLight')
    expect(calculatePressAfterPress(182.5).outOfRange).toBe(true)
  })
})
