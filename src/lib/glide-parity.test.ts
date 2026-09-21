import { describe, expect, it } from 'vitest'
import {
  caseKey,
  formatSeries,
  ourSeries,
  readBaseline,
  readReference,
} from '../../scripts/glide-reference.ts'

/**
 * Paridad con la app original de Glide.
 *
 * Los casos salen de `reference/glide-results.csv` —la captura de la app de
 * Glide—, leídos con el mismo parser que usa `npm run glide:compare` para
 * escribir `discrepancies.md`. Así los tests y el informe no pueden contar
 * cosas distintas: si el CSV crece, crecen los dos a la vez.
 *
 * Qué se espera de cada caso lo dice `reference/glide-baseline.json`, que está
 * versionado:
 *
 *   - Si NO está en la baseline, tiene que coincidir con Glide. Si falla, es
 *     una regresión.
 *   - Si SÍ está, es una discrepancia conocida (ver `discrepancies.md` y
 *     `reference/glide-notas.md`) y se comprueba con `it.fails`: el test salta
 *     en cuanto **deja** de fallar, que es la señal de que hay que regenerar
 *     el informe con `npm run glide:compare`.
 *
 * Hoy la baseline está vacía: los 32 casos capturados coinciden con Glide, así
 * que el segundo bloque no llega a declararse.
 *
 * Es la misma regla que aplica `npm run glide:check` en el build, contada caso
 * por caso.
 */

const cases = readReference()
const baseline = readBaseline()

const ours = (c: (typeof cases)[number]): string =>
  formatSeries(ourSeries(c.mode.calculate(c.effective)))

const known = new Set(Object.keys(baseline?.discrepancias ?? {}))

const expectedToMatch = cases.filter((c) => !known.has(caseKey(c)))
const expectedToFail = cases.filter((c) => known.has(caseKey(c)))

describe('paridad con la app de Glide', () => {
  it('hay baseline versionada', () => {
    expect(baseline, 'falta reference/glide-baseline.json: corre `npm run glide:compare`').not.toBe(
      null
    )
  })

  it('la baseline cubre los mismos casos que el CSV', () => {
    expect(baseline?.casos).toBe(cases.length)
    expect([...known].filter((key) => !cases.some((c) => caseKey(c) === key))).toEqual([])
  })

  describe('coinciden con Glide', () => {
    it.each(expectedToMatch)('$mode.id @ $effective kg', (c) => {
      expect(ours(c)).toBe(formatSeries(c.glide))
    })
  })

  // `it.each([])` sin casos hace fallar la suite entera, así que el bloque
  // solo se declara si queda alguna discrepancia que dar por conocida.
  if (expectedToFail.length > 0) {
    describe('discrepancias conocidas (ver discrepancies.md)', () => {
      it.fails.each(expectedToFail)('$mode.id @ $effective kg', (c) => {
        expect(ours(c)).toBe(formatSeries(c.glide))
      })
    })
  }
})
