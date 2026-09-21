/**
 * Genera una tabla CSV con los calentamientos propuestos para cada ejercicio,
 * barriendo todos los pesos efectivos de 0,5 en 0,5 kg.
 *
 * Importa las fórmulas reales de la app (src/lib/formulas.ts), así que la tabla
 * siempre refleja lo que ve el usuario en pantalla.
 *
 * Uso:
 *   npm run warmup:csv
 *   npm run warmup:csv -- --format long
 *   npm run warmup:csv -- --excel-es
 *   npm run warmup:csv -- --min 20 --max 150 --step 2.5 --out -
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  calculateDeadliftAfterSquat,
  calculateDeadliftNoSquat,
  calculateSquatPress,
} from '../src/lib/formulas.ts'
import type { WarmupResult, WarmupSet } from '../src/lib/formulas.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

type Exercise = {
  id: string
  label: string
  calculate: (effective: number) => WarmupResult
}

const EXERCISES: Exercise[] = [
  {
    id: 'sentadilla',
    label: 'Sentadilla',
    calculate: calculateSquatPress,
  },
  {
    id: 'press',
    label: 'Press',
    calculate: calculateSquatPress,
  },
  {
    id: 'peso-muerto',
    label: 'Peso muerto (después de sentadilla)',
    calculate: calculateDeadliftAfterSquat,
  },
  {
    id: 'peso-muerto-sin-sentadilla',
    label: 'Peso muerto (sin sentadilla)',
    calculate: calculateDeadliftNoSquat,
  },
]

/** Etiquetas de las series especiales, equivalentes a las de src/lib/i18n.ts. */
const SPECIAL_LABELS: Record<string, string> = {
  rdlEmptyBar: 'RDL barra vacía',
  tooLight: 'Demasiado poco peso',
}

// ---------------------------------------------------------------------------
// Opciones de línea de comandos
// ---------------------------------------------------------------------------

type Options = {
  min: number
  max: number
  step: number
  format: 'wide' | 'long'
  out: string | null
  sep: string
  decimal: string
  bom: boolean
  exercises: Exercise[]
}

const HELP = `
Genera la tabla de calentamientos para todos los pesos de un rango.

Opciones:
  --min <kg>          Peso efectivo mínimo (por defecto: 10)
  --max <kg>          Peso efectivo máximo (por defecto: 200)
  --step <kg>         Incremento (por defecto: 0.5)
  --format <f>        "wide" (una fila por peso) o "long" (una fila por serie).
                      Por defecto: wide
  --exercise <id>     Filtra un ejercicio; repetible. Ids disponibles:
                      ${EXERCISES.map((e) => e.id).join(', ')}
  --out <ruta>        Fichero de salida, o "-" para escribir por stdout.
                      Por defecto: out/warmup-<format>.csv
  --sep <car>         Separador de columnas (por defecto: ",")
  --decimal <car>     Separador decimal (por defecto: ".")
  --excel-es          Atajo de --sep ";" --decimal "," --bom (Excel en español)
  --bom               Escribe BOM UTF-8 al principio del fichero
  -h, --help          Muestra esta ayuda
`

/** Devuelve `null` si solo se ha pedido la ayuda. */
function parseArgs(argv: string[]): Options | null {
  const options: Options = {
    min: 10,
    max: 200,
    step: 0.5,
    format: 'wide',
    out: undefined as unknown as string | null,
    sep: ',',
    decimal: '.',
    bom: false,
    exercises: EXERCISES,
  }

  const picked: Exercise[] = []
  let outGiven = false

  const next = (i: number, flag: string): string => {
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`La opción ${flag} necesita un valor.`)
    }
    return value
  }

  const number = (raw: string, flag: string): number => {
    const value = Number(raw.replace(',', '.'))
    if (!Number.isFinite(value)) {
      throw new Error(`Valor no numérico para ${flag}: ${raw}`)
    }
    return value
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '-h':
      case '--help':
        console.log(HELP.trim())
        return null
      case '--min':
        options.min = number(next(i, arg), arg)
        i++
        break
      case '--max':
        options.max = number(next(i, arg), arg)
        i++
        break
      case '--step':
        options.step = number(next(i, arg), arg)
        i++
        break
      case '--format': {
        const value = next(i, arg)
        if (value !== 'wide' && value !== 'long') {
          throw new Error(`Formato desconocido: ${value} (usa "wide" o "long")`)
        }
        options.format = value
        i++
        break
      }
      case '--exercise': {
        const value = next(i, arg)
        const found = EXERCISES.find((e) => e.id === value)
        if (!found) {
          throw new Error(
            `Ejercicio desconocido: ${value}. Disponibles: ${EXERCISES.map((e) => e.id).join(', ')}`
          )
        }
        picked.push(found)
        i++
        break
      }
      case '--out':
        options.out = next(i, arg)
        outGiven = true
        i++
        break
      case '--sep':
        options.sep = next(i, arg)
        i++
        break
      case '--decimal':
        options.decimal = next(i, arg)
        i++
        break
      case '--excel-es':
        options.sep = ';'
        options.decimal = ','
        options.bom = true
        break
      case '--bom':
        options.bom = true
        break
      default:
        throw new Error(`Opción desconocida: ${arg}`)
    }
  }

  if (picked.length > 0) options.exercises = picked
  if (!outGiven) options.out = resolve(ROOT, 'out', `warmup-${options.format}.csv`)
  if (options.step <= 0) throw new Error('--step tiene que ser mayor que 0.')
  if (options.max < options.min) throw new Error('--max no puede ser menor que --min.')
  if (options.sep === options.decimal) {
    throw new Error('El separador de columnas y el decimal no pueden coincidir.')
  }

  return options
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

/** Pasos exactos: evita que 10 + n*0.5 acumule error en coma flotante. */
function weightRange(min: number, max: number, step: number): number[] {
  const count = Math.floor((max - min) / step + 1e-9)
  const weights: number[] = []
  for (let i = 0; i <= count; i++) {
    weights.push(Math.round((min + i * step) * 1e6) / 1e6)
  }
  return weights
}

function formatNumber(value: number, decimal: string): string {
  const text = Number(value.toFixed(2)).toString()
  return decimal === '.' ? text : text.replace('.', decimal)
}

/** Celda legible para una serie: "60 kg x4", "RDL barra vacía x8". */
function formatSet(set: WarmupSet, decimal: string): string {
  const weight =
    typeof set.weight === 'number'
      ? `${formatNumber(set.weight, decimal)} kg`
      : (SPECIAL_LABELS[set.weight] ?? set.weight)
  return set.reps ? `${weight} ${set.reps}` : weight
}

function csvField(value: string, sep: string): string {
  const needsQuotes =
    value.includes(sep) || value.includes('"') || value.includes('\n') || value.includes('\r')
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value
}

function csvLine(fields: string[], sep: string): string {
  return fields.map((f) => csvField(f, sep)).join(sep)
}

/** Aviso cuando no hay calentamiento que proponer. */
function noteFor(result: WarmupResult): string {
  if (result.outOfRange) return 'Peso fuera de rango (máx. 180 kg)'
  if (result.sets.length === 1 && result.sets[0].weight === 'tooLight') {
    return SPECIAL_LABELS.tooLight
  }
  return ''
}

function isRealSets(result: WarmupResult): boolean {
  return !result.outOfRange && !(result.sets.length === 1 && result.sets[0].weight === 'tooLight')
}

// ---------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------

type WideRow = {
  exercise: Exercise
  weight: number
  sets: string[]
  note: string
}

function buildWide(options: Options): string {
  const weights = weightRange(options.min, options.max, options.step)

  const rows: WideRow[] = []
  let maxSets = 0

  for (const exercise of options.exercises) {
    for (const weight of weights) {
      const result = exercise.calculate(weight)
      const sets = isRealSets(result)
        ? result.sets.map((s) => formatSet(s, options.decimal))
        : []
      maxSets = Math.max(maxSets, sets.length)
      rows.push({ exercise, weight, sets, note: noteFor(result) })
    }
  }

  const header = [
    'ejercicio_id',
    'ejercicio',
    'peso_efectivo_kg',
    'n_series',
    ...Array.from({ length: maxSets }, (_, i) => `serie_${i + 1}`),
    'aviso',
  ]

  const lines = [csvLine(header, options.sep)]
  for (const row of rows) {
    const padded = Array.from({ length: maxSets }, (_, i) => row.sets[i] ?? '')
    lines.push(
      csvLine(
        [
          row.exercise.id,
          row.exercise.label,
          formatNumber(row.weight, options.decimal),
          String(row.sets.length),
          ...padded,
          row.note,
        ],
        options.sep
      )
    )
  }

  return lines.join('\r\n') + '\r\n'
}

function buildLong(options: Options): string {
  const weights = weightRange(options.min, options.max, options.step)

  const header = [
    'ejercicio_id',
    'ejercicio',
    'peso_efectivo_kg',
    'orden',
    'serie',
    'peso_serie_kg',
    'reps',
    'aviso',
  ]

  const lines = [csvLine(header, options.sep)]

  for (const exercise of options.exercises) {
    for (const weight of weights) {
      const result = exercise.calculate(weight)
      const pesoEfectivo = formatNumber(weight, options.decimal)

      if (!isRealSets(result)) {
        lines.push(
          csvLine(
            [exercise.id, exercise.label, pesoEfectivo, '', '', '', '', noteFor(result)],
            options.sep
          )
        )
        continue
      }

      result.sets.forEach((set, index) => {
        const isNumeric = typeof set.weight === 'number'
        lines.push(
          csvLine(
            [
              exercise.id,
              exercise.label,
              pesoEfectivo,
              String(index + 1),
              formatSet(set, options.decimal),
              isNumeric ? formatNumber(set.weight as number, options.decimal) : '',
              set.reps,
              '',
            ],
            options.sep
          )
        )
      })
    }
  }

  return lines.join('\r\n') + '\r\n'
}

// ---------------------------------------------------------------------------

function main() {
  let options: Options | null
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`)
    console.error('\nUsa --help para ver las opciones.')
    process.exitCode = 1
    return
  }

  if (options === null) return // solo se pidió --help

  const body = options.format === 'wide' ? buildWide(options) : buildLong(options)
  const csv = (options.bom ? '﻿' : '') + body

  if (options.out === '-') {
    process.stdout.write(csv)
    return
  }

  const out = resolve(options.out!)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, csv, 'utf8')

  const dataRows = body.trimEnd().split('\r\n').length - 1
  const weights = weightRange(options.min, options.max, options.step).length
  console.log(
    `${out}\n` +
      `  formato:    ${options.format}\n` +
      `  ejercicios: ${options.exercises.map((e) => e.id).join(', ')}\n` +
      `  pesos:      ${formatNumber(options.min, '.')}–${formatNumber(options.max, '.')} kg ` +
      `cada ${formatNumber(options.step, '.')} kg (${weights} valores)\n` +
      `  filas:      ${dataRows}`
  )
}

main()
