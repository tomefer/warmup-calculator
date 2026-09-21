import { describe, it, expect } from 'vitest'
import { isPartialWeight, parseWeight } from './parse-weight'

describe('isPartialWeight', () => {
  it('acepta lo que se teclea de camino a un peso con decimales', () => {
    // La secuencia real al escribir "7.5" tecla a tecla. El paso "7." es el que
    // rompía antes: se rechazaba y el punto desaparecía.
    for (const raw of ['', '7', '7.', '7.5']) {
      expect(isPartialWeight(raw), raw).toBe(true)
    }
  })

  it('acepta la coma como separador', () => {
    for (const raw of ['7,', '7,5', '102,5']) {
      expect(isPartialWeight(raw), raw).toBe(true)
    }
  })

  it('rechaza lo que no es un peso', () => {
    for (const raw of ['abc', '7kg', '-5', '7.5.2', '7,5,2', ' 7', '7 ', '1e3']) {
      expect(isPartialWeight(raw), raw).toBe(false)
    }
  })
})

describe('parseWeight', () => {
  it('lee los pesos de gimnasio habituales', () => {
    expect(parseWeight('7.5')).toBe(7.5)
    expect(parseWeight('102.5')).toBe(102.5)
    expect(parseWeight('60')).toBe(60)
  })

  it('trata la coma igual que el punto', () => {
    // parseFloat('7,5') a secas devuelve 7 sin avisar: media serie de más.
    expect(parseWeight('7,5')).toBe(7.5)
    expect(parseWeight('102,5')).toBe(102.5)
  })

  it('devuelve null mientras no haya un número', () => {
    expect(parseWeight('')).toBeNull()
    expect(parseWeight('.')).toBeNull()
    expect(parseWeight(',')).toBeNull()
  })

  it('trata un decimal a medias como el entero ya escrito', () => {
    // Permite que el calentamiento de 7 kg siga en pantalla mientras se teclea
    // el ".5", en vez de parpadear a vacío.
    expect(parseWeight('7.')).toBe(7)
    expect(parseWeight('7,')).toBe(7)
  })
})
