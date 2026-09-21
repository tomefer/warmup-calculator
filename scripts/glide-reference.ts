/**
 * La captura de la app original de Glide, leída y normalizada.
 *
 * Es la fuente de verdad de la paridad, y la comparten dos consumidores:
 *
 *   - `src/lib/glide-parity.test.ts`, que convierte cada caso en un test.
 *   - `scripts/compare-glide.ts`, que escribe `discrepancies.md`.
 *
 * Los dos leen el mismo CSV (`reference/glide-results.csv`) con el mismo
 * parser, así que no puede pasar que el informe y los tests discrepen entre
 * ellos: solo pueden discrepar de Glide, que es de lo que se trata.
 *
 * Para añadir casos, ver el README ("Comparación contra la app de Glide").
 */

import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  calculateDeadliftAfterSquat,
  calculateDeadliftNoSquat,
  calculatePressAfterPress,
  calculateSquatPress,
} from '../src/lib/formulas.ts'
import type { WarmupResult } from '../src/lib/formulas.ts'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** El CSV con lo que muestra Glide. Versionado; se edita a mano. */
export const GLIDE_REFERENCE_PATH = resolve(ROOT, 'reference/glide-results.csv')

/** La foto de las discrepancias aceptadas. Versionada; la escribe glide:compare. */
export const GLIDE_BASELINE_PATH = resolve(ROOT, 'reference/glide-baseline.json')

// ---------------------------------------------------------------------------
// Modos
// ---------------------------------------------------------------------------

export type Mode = {
  id: string
  label: string
  calculate: (effective: number) => WarmupResult
}

export const MODES: Mode[] = [
  { id: 'squat', label: 'Sentadilla', calculate: calculateSquatPress },
  { id: 'press', label: 'Press', calculate: calculateSquatPress },
  { id: 'pressAfterPress', label: 'Press con press previo', calculate: calculatePressAfterPress },
  {
    id: 'deadliftAfterSquat',
    label: 'Peso muerto (después de sentadilla)',
    calculate: calculateDeadliftAfterSquat,
  },
  {
    id: 'deadliftNoSquat',
    label: 'Peso muerto (sin sentadilla)',
    calculate: calculateDeadliftNoSquat,
  },
]

const MODE_BY_ID = new Map(MODES.map((m) => [m.id, m]))

/** Literales especiales: cómo los escribe Glide y cómo los llama la app. */
const SPECIAL_ALIASES: Record<string, string> = {
  rdlemptybar: 'rdlEmptyBar',
  'rdl con barra vacía': 'rdlEmptyBar',
  'rdl con barra vacia': 'rdlEmptyBar',
  'rdl barra vacía': 'rdlEmptyBar',
  'rdl barra vacia': 'rdlEmptyBar',
  toolight: 'tooLight',
  'demasiado poco peso': 'tooLight',
}

export const OUT_OF_RANGE = 'OUT_OF_RANGE'

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** Parser de CSV con comillas dobles. Devuelve las filas como arrays de celdas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  for (let i = 0; i < body.length; i++) {
    const char = body[i]

    if (quoted) {
      if (char === '"') {
        if (body[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

export function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function csvLine(fields: string[]): string {
  return fields.map(csvField).join(',')
}

// ---------------------------------------------------------------------------
// Normalización de series
// ---------------------------------------------------------------------------

export type Serie = {
  /** Peso en kg, o el literal especial (`rdlEmptyBar`, `tooLight`). */
  weight: number | string
  reps: string
}

export function formatWeight(weight: number | string): string {
  return typeof weight === 'number' ? String(Number(weight.toFixed(2))) : weight
}

export function formatSerie(serie: Serie): string {
  const weight = formatWeight(serie.weight)
  return serie.reps ? `${weight} ${serie.reps}` : weight
}

/** Texto canónico de una lista de series, que es lo que se compara. */
export function formatSeries(series: Serie[] | null): string {
  return series === null ? OUT_OF_RANGE : series.map(formatSerie).join(' | ')
}

/**
 * Lee una serie tal y como la pinta Glide y la deja en forma canónica.
 * Tolera "60,00 kg x5x2*", "RDL con barra vacía x8", "12.5 x1".
 */
function parseSerie(raw: string, where: string): Serie {
  const text = raw.trim().replace(/\s+/g, ' ')
  if (text === '') throw new Error(`${where}: serie vacía.`)

  const match = text.match(/^(.*?)\s*(x[\dx]+)\*?$/i)
  const weightText = (match ? match[1] : text).trim().replace(/\s*kg$/i, '')
  const reps = match ? match[2].toLowerCase() : ''

  const special = SPECIAL_ALIASES[weightText.toLowerCase()]
  if (special) return { weight: special, reps }

  const numeric = Number(weightText.replace(',', '.'))
  if (!Number.isFinite(numeric)) {
    throw new Error(`${where}: no entiendo el peso "${weightText}" en "${raw.trim()}".`)
  }

  return { weight: numeric, reps }
}

export function parseSeries(raw: string, where: string): Serie[] | null {
  const text = raw.trim()
  if (text.toUpperCase() === OUT_OF_RANGE) return null
  return text.split('|').map((part) => parseSerie(part, where))
}

/** Nuestro resultado, en la misma forma canónica que la referencia. */
export function ourSeries(result: WarmupResult): Serie[] | null {
  if (result.outOfRange) return null
  return result.sets.map((set) => ({ weight: set.weight, reps: set.reps }))
}

// ---------------------------------------------------------------------------
// Lectura de la referencia
// ---------------------------------------------------------------------------

export type ReferenceCase = {
  mode: Mode
  effective: number
  /** Las series de Glide, o `null` si la app no calcula a ese peso. */
  glide: Serie[] | null
  note: string
  source: string
  line: number
}

/** `squat@112.5`: identifica un caso en la baseline y en los informes. */
export function caseKey(c: ReferenceCase): string {
  return `${c.mode.id}@${c.effective}`
}

export function readReference(path: string = GLIDE_REFERENCE_PATH): ReferenceCase[] {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    throw new Error(
      `No encuentro el CSV de referencia: ${path}\n` +
        'Es la captura de la app de Glide; sin él no hay nada contra lo que comparar.'
    )
  }

  const rows = parseCsv(text)
  if (rows.length === 0) throw new Error(`El CSV de referencia está vacío: ${path}`)

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const need = (name: string): number => {
    const index = header.indexOf(name)
    if (index === -1) throw new Error(`Al CSV de referencia le falta la columna "${name}".`)
    return index
  }

  const iMode = need('modo')
  const iWeight = need('peso_efectivo_kg')
  const iSeries = need('series')
  const iSource = header.indexOf('fuente')
  const iNote = header.indexOf('nota')

  const cases: ReferenceCase[] = []
  const seen = new Set<string>()

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const line = r + 1
    const where = `${relative(ROOT, path)}:${line}`

    const modeId = (row[iMode] ?? '').trim()
    const mode = MODE_BY_ID.get(modeId)
    if (!mode) {
      throw new Error(
        `${where}: modo desconocido "${modeId}". Disponibles: ${MODES.map((m) => m.id).join(', ')}.`
      )
    }

    const effective = Number((row[iWeight] ?? '').trim().replace(',', '.'))
    if (!Number.isFinite(effective)) {
      throw new Error(`${where}: peso efectivo no numérico "${row[iWeight]}".`)
    }

    const key = `${modeId}@${effective}`
    if (seen.has(key)) throw new Error(`${where}: caso repetido ${key}.`)
    seen.add(key)

    cases.push({
      mode,
      effective,
      glide: parseSeries(row[iSeries] ?? '', where),
      note: (row[iNote] ?? '').trim(),
      source: (row[iSource] ?? '').trim(),
      line,
    })
  }

  if (cases.length === 0) {
    throw new Error(
      `El CSV de referencia no tiene ni un caso: ${path}\n` +
        'Sin casos no hay paridad que comprobar; ver el README.'
    )
  }

  return cases
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

/**
 * Las discrepancias que damos hoy por buenas, tal y como las dejó el último
 * `npm run glide:compare`. Es lo que convierte "falla" en "falla como
 * esperábamos": un caso que no está aquí tiene que coincidir con Glide.
 */
export type Baseline = {
  /** Cuándo se regeneró, para saber a qué captura corresponde. */
  actualizado: string
  casos: number
  /** Clave del caso -> texto de Glide y nuestro. */
  discrepancias: Record<string, { glide: string; nuestro: string }>
}

export function readBaseline(path: string = GLIDE_BASELINE_PATH): Baseline | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Baseline
  } catch {
    return null
  }
}
