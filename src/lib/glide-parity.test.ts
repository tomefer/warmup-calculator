import { describe, it, expect } from 'vitest'
import {
  calculateSquatPress,
  calculatePressAfterPress,
  calculateDeadliftAfterSquat,
  calculateDeadliftNoSquat,
  type WarmupResult,
} from './formulas'
import { glideCases, type GlideCase } from './__fixtures__/glide-reference'

/**
 * Paridad con la app original de Glide.
 *
 * Recorre los casos de `__fixtures__/glide-reference.ts`. Un fallo aquí es una
 * discrepancia real y localizada: el modo, el peso, lo que esperaba Glide y lo
 * que damos nosotros.
 */

const format = (r: WarmupResult): string =>
  r.outOfRange
    ? 'OUT_OF_RANGE'
    : r.sets.map((s) => `${s.weight}${s.reps ? ' ' + s.reps : ''}`).join(' | ')

function calculate(c: GlideCase): WarmupResult {
  switch (c.mode) {
    case 'squat':
    case 'press':
      return calculateSquatPress(c.effective)
    case 'deadliftAfterSquat':
      return calculateDeadliftAfterSquat(c.effective)
    case 'deadliftNoSquat':
      return calculateDeadliftNoSquat(c.effective)
    case 'pressAfterPress':
      return calculatePressAfterPress(c.effective)
  }
}

describe('paridad con la app de Glide', () => {
  if (glideCases.length === 0) {
    it.skip('sin casos de referencia todavía — ver src/lib/__fixtures__/glide-reference.ts', () => {})
    return
  }

  it.each(glideCases)(
    '$mode @ $effective kg',
    (c) => {
      expect(format(calculate(c))).toBe(c.expected)
    }
  )
})
