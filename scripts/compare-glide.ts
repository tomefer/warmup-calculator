/**
 * Compara los resultados de NUESTRA app con los de la app original de Glide.
 *
 * Lee la captura de Glide (reference/glide-results.csv), calcula lo que da
 * nuestra app para esos mismos inputs importando las fórmulas reales
 * (src/lib/formulas.ts), y saca:
 *
 *   out/nuestro-mismos-inputs.csv  nuestras series para cada input de Glide
 *   out/comparacion-glide.csv      las dos columnas enfrentadas, con el estado
 *   discrepancies.md               el informe legible de lo que falla
 *   reference/glide-baseline.json  la foto de las discrepancias aceptadas
 *
 * Uso:
 *   npm run glide:compare      regenera los cuatro ficheros
 *   npm run glide:check        comprueba contra la baseline (lo usa el build)
 *
 * El modo --check no escribe nada: falla si la lista de discrepancias ya no
 * coincide con la baseline, tanto si aparece una nueva (regresión) como si
 * desaparece una conocida (arreglo sin actualizar el informe).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import {
  caseKey,
  csvLine,
  formatSerie,
  formatSeries,
  formatWeight,
  GLIDE_BASELINE_PATH,
  GLIDE_REFERENCE_PATH,
  MODES,
  ourSeries,
  readBaseline,
  readReference,
  ROOT,
  type Baseline,
  type ReferenceCase,
  type Serie,
} from './glide-reference.ts'

// ---------------------------------------------------------------------------
// Opciones
// ---------------------------------------------------------------------------

type Options = {
  reference: string
  outDir: string
  markdown: string
  baseline: string
  notes: string
  check: boolean
  quiet: boolean
}

const HELP = `
Compara nuestros resultados con la captura de la app de Glide.

Opciones:
  --check             No escribe nada: compara contra la baseline y devuelve
                      código de salida 1 si la lista de discrepancias cambió.
  --reference <ruta>  CSV de Glide (por defecto: reference/glide-results.csv)
  --baseline <ruta>   Baseline JSON (por defecto: reference/glide-baseline.json)
  --out-dir <ruta>    Carpeta de los CSV generados (por defecto: out)
  --md <ruta>         Informe markdown (por defecto: discrepancies.md)
  --notes <ruta>      Notas a mano que se copian en el informe
                      (por defecto: reference/glide-notas.md, opcional)
  --quiet             Solo imprime el resumen final
  -h, --help          Muestra esta ayuda

Formato del CSV de referencia:
  modo,peso_efectivo_kg,series,fuente,nota

  modo    squat | press | pressAfterPress | deadliftAfterSquat | deadliftNoSquat
  series  las series separadas por "|", cada una "<peso> <reps>", por ejemplo
          "20 x5x2 | 50 x4 | 70 x2 | 90 x1". Si Glide no calcula el peso,
          escribe OUT_OF_RANGE.

  Al leerlo se tolera lo que hace la app de Glide al pintar: coma decimal,
  ceros de más ("60,00"), el sufijo " kg", el asterisco de la nota al pie
  ("x5x2*") y el literal "RDL con barra vacía".
`

function parseArgs(argv: string[]): Options | null {
  const options: Options = {
    reference: GLIDE_REFERENCE_PATH,
    outDir: resolve(ROOT, 'out'),
    markdown: resolve(ROOT, 'discrepancies.md'),
    baseline: GLIDE_BASELINE_PATH,
    notes: resolve(ROOT, 'reference/glide-notas.md'),
    check: false,
    quiet: false,
  }

  const next = (i: number, flag: string): string => {
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`La opción ${flag} necesita un valor.`)
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
      case '--check':
        options.check = true
        break
      case '--quiet':
        options.quiet = true
        break
      case '--reference':
        options.reference = resolve(next(i, arg))
        i++
        break
      case '--baseline':
        options.baseline = resolve(next(i, arg))
        i++
        break
      case '--out-dir':
        options.outDir = resolve(next(i, arg))
        i++
        break
      case '--md':
        options.markdown = resolve(next(i, arg))
        i++
        break
      case '--notes':
        options.notes = resolve(next(i, arg))
        i++
        break
      default:
        throw new Error(`Opción desconocida: ${arg}`)
    }
  }

  return options
}

// ---------------------------------------------------------------------------
// Comparación
// ---------------------------------------------------------------------------

type Comparison = {
  key: string
  case: ReferenceCase
  ours: Serie[] | null
  glideText: string
  oursText: string
  matches: boolean
  /** Por qué falla, una línea por diferencia. Vacío si coincide. */
  reasons: string[]
}

/** Diferencias serie a serie, en lenguaje llano. */
function explain(glide: Serie[] | null, ours: Serie[] | null): string[] {
  if (glide === null && ours === null) return []
  if (glide === null) return ['Glide no calcula a este peso ("ya eres experto") y nosotros sí.']
  if (ours === null) return ['Nosotros lo damos por fuera de rango y Glide sí calcula.']

  const reasons: string[] = []

  if (glide.length !== ours.length) {
    reasons.push(`Número de series: Glide ${glide.length}, nosotros ${ours.length}.`)
  }

  const common = Math.min(glide.length, ours.length)
  for (let i = 0; i < common; i++) {
    const g = glide[i]
    const o = ours[i]
    const sameWeight = formatWeight(g.weight) === formatWeight(o.weight)
    const sameReps = g.reps === o.reps
    if (sameWeight && sameReps) continue

    const what = sameWeight ? 'reps' : sameReps ? 'peso' : 'peso y reps'
    reasons.push(`Serie ${i + 1} (${what}): Glide "${formatSerie(g)}", nosotros "${formatSerie(o)}".`)
  }

  for (let i = common; i < glide.length; i++) {
    reasons.push(`Serie ${i + 1}: Glide "${formatSerie(glide[i])}", nosotros no la damos.`)
  }
  for (let i = common; i < ours.length; i++) {
    reasons.push(`Serie ${i + 1}: nosotros "${formatSerie(ours[i])}", Glide no la da.`)
  }

  return reasons
}

function compare(cases: ReferenceCase[]): Comparison[] {
  return cases.map((c) => {
    const ours = ourSeries(c.mode.calculate(c.effective))
    const glideText = formatSeries(c.glide)
    const oursText = formatSeries(ours)
    const reasons = explain(c.glide, ours)
    return {
      key: caseKey(c),
      case: c,
      ours,
      glideText,
      oursText,
      matches: reasons.length === 0,
      reasons,
    }
  })
}

// ---------------------------------------------------------------------------
// Salidas
// ---------------------------------------------------------------------------

function buildOursCsv(comparisons: Comparison[]): string {
  const lines = [csvLine(['modo', 'modo_etiqueta', 'peso_efectivo_kg', 'n_series', 'series'])]
  for (const c of comparisons) {
    lines.push(
      csvLine([
        c.case.mode.id,
        c.case.mode.label,
        formatWeight(c.case.effective),
        c.ours === null ? '' : String(c.ours.length),
        c.oursText,
      ])
    )
  }
  return lines.join('\r\n') + '\r\n'
}

function buildComparisonCsv(comparisons: Comparison[]): string {
  const lines = [
    csvLine(['modo', 'peso_efectivo_kg', 'glide', 'nuestro', 'estado', 'diferencias']),
  ]
  for (const c of comparisons) {
    lines.push(
      csvLine([
        c.case.mode.id,
        formatWeight(c.case.effective),
        c.glideText,
        c.oursText,
        c.matches ? 'OK' : 'FALLA',
        c.reasons.join(' '),
      ])
    )
  }
  return lines.join('\r\n') + '\r\n'
}

/**
 * Agrupa los fallos por el tipo de diferencia, no por el caso concreto.
 * "Serie 3 (reps)" repetido 12 veces es un solo bug, no doce.
 */
function patterns(failures: Comparison[]): { signature: string; cases: Comparison[] }[] {
  const groups = new Map<string, Comparison[]>()

  for (const c of failures) {
    const signature = c.reasons
      .map((r) => r.replace(/: Glide.*$/, '').replace(/: nosotros.*$/, ''))
      .join(' + ')
    const group = groups.get(signature)
    if (group) group.push(c)
    else groups.set(signature, [c])
  }

  return [...groups.entries()]
    .map(([signature, cases]) => ({ signature, cases }))
    .sort((a, b) => b.cases.length - a.cases.length)
}

function buildMarkdown(comparisons: Comparison[], referencePath: string, notes: string): string {
  const failures = comparisons.filter((c) => !c.matches)
  const today = new Date().toISOString().slice(0, 10)
  const ref = relative(ROOT, referencePath).replace(/\\/g, '/')

  const out: string[] = []
  out.push('# Discrepancias con la app de Glide')
  out.push('')
  out.push('> Fichero generado por `npm run glide:compare`. **No lo edites a mano**: los')
  out.push('> cambios se pierden en la siguiente ejecución. Lo que se toca es el CSV de')
  out.push(`> referencia (\`${ref}\`), las notas a mano de \`reference/glide-notas.md\``)
  out.push('> o las fórmulas de `src/lib/formulas.ts`.')
  out.push('')
  out.push(`Última comparación: ${today}`)
  out.push('')
  out.push(
    `Casos comparados: **${comparisons.length}** · Coinciden: **${comparisons.length - failures.length}** · Fallan: **${failures.length}**`
  )
  out.push('')

  // Las notas a mano van siempre, haya fallos o no: cuando no los hay siguen
  // diciendo qué falta por capturar de Glide, que es lo que queda por hacer.
  const pushNotes = () => {
    if (notes.trim() === '') return
    out.push('## Análisis')
    out.push('')
    out.push('<!-- Escrito a mano en reference/glide-notas.md; se copia aquí tal cual. -->')
    out.push('')
    out.push(notes.trim())
    out.push('')
  }

  if (failures.length === 0) {
    out.push('No hay discrepancias: nuestra app da exactamente lo mismo que Glide en todos')
    out.push('los casos capturados.')
    out.push('')
    pushNotes()
  } else {
    out.push('## Resumen por modo')
    out.push('')
    out.push('| Modo | Casos | Fallan |')
    out.push('|---|---:|---:|')
    for (const mode of MODES) {
      const all = comparisons.filter((c) => c.case.mode.id === mode.id)
      if (all.length === 0) continue
      const bad = all.filter((c) => !c.matches).length
      out.push(`| \`${mode.id}\` — ${mode.label} | ${all.length} | ${bad} |`)
    }
    out.push('')

    out.push('## Patrones')
    out.push('')
    out.push('Los fallos agrupados por el tipo de diferencia: cada fila es probablemente')
    out.push('**un solo bug**, por muchos pesos que arrastre.')
    out.push('')
    out.push('| Diferencia | Casos | Dónde |')
    out.push('|---|---:|---|')
    for (const { signature, cases } of patterns(failures)) {
      const where = cases.map((c) => `\`${c.key}\``).join(', ')
      out.push(`| ${signature} | ${cases.length} | ${where} |`)
    }
    out.push('')

    pushNotes()

    for (const mode of MODES) {
      const bad = failures.filter((c) => c.case.mode.id === mode.id)
      if (bad.length === 0) continue

      out.push(`## ${mode.label} (\`${mode.id}\`)`)
      out.push('')
      for (const c of bad) {
        out.push(`### ${formatWeight(c.case.effective)} kg`)
        out.push('')
        out.push(`- **Glide:** \`${c.glideText}\``)
        out.push(`- **Nosotros:** \`${c.oursText}\``)
        for (const reason of c.reasons) out.push(`- ${reason}`)
        if (c.case.note) out.push(`- _Nota de la captura:_ ${c.case.note}`)
        out.push('')
      }
    }
  }

  out.push('## Cómo se comprueba')
  out.push('')
  out.push('```bash')
  out.push('npm run glide:compare   # regenera este informe y los CSV de out/')
  out.push('npm run glide:check     # falla si la lista de discrepancias cambió')
  out.push('```')
  out.push('')
  out.push('`glide:check` corre dentro de `npm run build`, así que cualquier cambio en las')
  out.push('fórmulas que rompa un caso que antes coincidía —o que arregle uno sin')
  out.push('actualizar este informe— para el build.')
  out.push('')
  out.push('Ficheros generados en `out/` (no versionados):')
  out.push('')
  out.push('- `nuestro-mismos-inputs.csv` — nuestras series para los inputs de la captura.')
  out.push('- `comparacion-glide.csv` — las dos columnas enfrentadas, con el estado.')
  out.push('')
  out.push('Para anotar algo que sobreviva a la siguiente ejecución, escríbelo en')
  out.push('`reference/glide-notas.md`: se copia entero en la sección «Análisis».')
  out.push('')

  return out.join('\n')
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

function buildBaseline(comparisons: Comparison[]): Baseline {
  const discrepancias: Record<string, { glide: string; nuestro: string }> = {}
  for (const c of comparisons) {
    if (!c.matches) discrepancias[c.key] = { glide: c.glideText, nuestro: c.oursText }
  }
  return {
    actualizado: new Date().toISOString().slice(0, 10),
    casos: comparisons.length,
    discrepancias,
  }
}

/** Las notas a mano son opcionales: si no hay fichero, la sección no sale. */
function readNotes(path: string): string {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------

type CheckResult = {
  regressions: Comparison[]
  fixed: string[]
  changed: Comparison[]
}

/** Compara la foto actual con la baseline aceptada. */
function checkAgainstBaseline(comparisons: Comparison[], baseline: Baseline): CheckResult {
  const known = baseline.discrepancias ?? {}
  const regressions: Comparison[] = []
  const changed: Comparison[] = []

  for (const c of comparisons) {
    if (!c.matches) {
      const previous = known[c.key]
      if (!previous) regressions.push(c)
      else if (previous.nuestro !== c.oursText) changed.push(c)
    }
  }

  const current = new Set(comparisons.filter((c) => !c.matches).map((c) => c.key))
  const fixed = Object.keys(known).filter((key) => !current.has(key))

  return { regressions, fixed, changed }
}

function runCheck(comparisons: Comparison[], options: Options): number {
  const baseline = readBaseline(options.baseline)

  if (!baseline) {
    console.error(
      `Error: no hay baseline en ${relative(ROOT, options.baseline)}.\n` +
        'Ejecuta `npm run glide:compare` para crearla a partir del estado actual.'
    )
    return 1
  }

  const { regressions, fixed, changed } = checkAgainstBaseline(comparisons, baseline)
  const failures = comparisons.filter((c) => !c.matches).length

  if (regressions.length === 0 && fixed.length === 0 && changed.length === 0) {
    console.log(
      `Paridad con Glide: ${comparisons.length} casos, ${failures} discrepancia(s) conocida(s), 0 nuevas.`
    )
    return 0
  }

  console.error('Paridad con Glide: la lista de discrepancias ya no coincide con la baseline.\n')

  if (regressions.length > 0) {
    console.error(`REGRESIÓN — ${regressions.length} caso(s) que antes coincidían y ahora no:`)
    for (const c of regressions) {
      console.error(`  ${c.key}`)
      console.error(`    Glide:    ${c.glideText}`)
      console.error(`    Nosotros: ${c.oursText}`)
      for (const reason of c.reasons) console.error(`    ${reason}`)
    }
    console.error('')
  }

  if (changed.length > 0) {
    console.error(`CAMBIADO — ${changed.length} discrepancia(s) conocida(s) que dan otra cosa:`)
    for (const c of changed) {
      console.error(`  ${c.key}`)
      console.error(`    baseline: ${baseline.discrepancias[c.key].nuestro}`)
      console.error(`    ahora:    ${c.oursText}`)
    }
    console.error('')
  }

  if (fixed.length > 0) {
    console.error(`ARREGLADO — ${fixed.length} discrepancia(s) que ya no fallan:`)
    for (const key of fixed) console.error(`  ${key}`)
    console.error('')
  }

  console.error('Si el cambio es el que buscabas, ejecuta `npm run glide:compare` para')
  console.error('actualizar discrepancies.md y la baseline, y revisa el diff.')
  return 1
}

function runCompare(comparisons: Comparison[], options: Options): number {
  const failures = comparisons.filter((c) => !c.matches)

  mkdirSync(options.outDir, { recursive: true })
  const oursPath = resolve(options.outDir, 'nuestro-mismos-inputs.csv')
  const comparisonPath = resolve(options.outDir, 'comparacion-glide.csv')

  writeFileSync(oursPath, buildOursCsv(comparisons), 'utf8')
  writeFileSync(comparisonPath, buildComparisonCsv(comparisons), 'utf8')
  const notes = readNotes(options.notes)
  writeFileSync(options.markdown, buildMarkdown(comparisons, options.reference, notes), 'utf8')

  mkdirSync(dirname(options.baseline), { recursive: true })
  writeFileSync(options.baseline, JSON.stringify(buildBaseline(comparisons), null, 2) + '\n', 'utf8')

  if (!options.quiet && failures.length > 0) {
    console.log(`Resultados nuestros que fallan (${failures.length} de ${comparisons.length}):\n`)
    for (const c of failures) {
      console.log(`  ${c.case.mode.label} @ ${formatWeight(c.case.effective)} kg`)
      console.log(`    Glide:    ${c.glideText}`)
      console.log(`    Nosotros: ${c.oursText}`)
      for (const reason of c.reasons) console.log(`    · ${reason}`)
      console.log('')
    }
  }

  const rel = (p: string) => relative(ROOT, p).replace(/\\/g, '/')
  console.log(
    `Casos: ${comparisons.length} · coinciden: ${comparisons.length - failures.length} · fallan: ${failures.length}`
  )
  console.log(`  ${rel(oursPath)}`)
  console.log(`  ${rel(comparisonPath)}`)
  console.log(`  ${rel(options.markdown)}`)
  console.log(`  ${rel(options.baseline)}`)

  return 0
}

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

  let comparisons: Comparison[]
  try {
    comparisons = compare(readReference(options.reference))
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`)
    process.exitCode = 1
    return
  }

  process.exitCode = options.check ? runCheck(comparisons, options) : runCompare(comparisons, options)
}

main()
