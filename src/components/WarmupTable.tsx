import { t } from '@/lib/i18n'
import type { WarmupSet } from '@/lib/formulas'
import { cn } from '@/lib/utils'

interface WarmupTableProps {
  sets: WarmupSet[]
  className?: string
}

function formatWeight(weight: number | string): string {
  if (typeof weight === 'string') {
    if (weight === 'tooLight') return t.warmup.tooLight
    if (weight === 'rdlEmptyBar') return t.warmup.rdlEmptyBar
    return weight
  }
  return `${weight} kg`
}

export function WarmupTable({ sets, className }: WarmupTableProps) {
  if (sets.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h2 className="text-base text-[var(--muted-foreground)]">
        {t.warmup.sectionTitle}
      </h2>
      {/* La vista es responsive, igual que en Glide: en móvil cada serie es una
          fila —peso a la izquierda en gris, repeticiones a la derecha, con su
          línea separadora—, y a partir de `sm` pasa a columnas. */}
      <div className="flex flex-col sm:grid sm:grid-cols-4 sm:gap-x-2 sm:gap-y-4">
        {sets.map((set, index) => {
          const isStringWeight = typeof set.weight === 'string'
          const isError = set.weight === 'tooLight'

          return (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between gap-3 border-b border-[var(--border)] py-3 text-base',
                // En columnas no hay filas que separar: el peso vuelve arriba
                // y las repeticiones debajo, sin línea ni altura de fila.
                'sm:flex-col sm:items-start sm:justify-start sm:gap-0.5 sm:border-0 sm:py-0 sm:text-sm',
                // Los avisos son frases, no cifras: ocupan la fila entera.
                isStringWeight && 'sm:col-span-4'
              )}
            >
              <span
                className={cn(
                  isError
                    ? 'font-medium text-red-600 dark:text-red-400'
                    : 'text-[var(--muted-foreground)]'
                )}
              >
                {formatWeight(set.weight)}
              </span>
              {set.reps && (
                <span className="text-[var(--foreground)]">{set.reps}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
