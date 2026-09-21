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
      {/* Glide no dibuja tabla ni tarjeta: reparte las series en columnas con
          el peso arriba en gris y las repeticiones debajo en negro. */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-4">
        {sets.map((set, index) => {
          const isStringWeight = typeof set.weight === 'string'
          const isError = set.weight === 'tooLight'

          return (
            <div
              key={index}
              className={cn(
                'flex flex-col gap-0.5 text-sm',
                // Los avisos son frases, no cifras: ocupan la fila entera.
                isStringWeight && 'col-span-4'
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
