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
    <div className={cn('flex flex-col', className)}>
      <h2 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
        {t.warmup.sectionTitle}
      </h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {sets.map((set, index) => {
          const isStringWeight = typeof set.weight === 'string'
          const isError = set.weight === 'tooLight'

          return (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between px-4 py-3',
                index !== sets.length - 1 &&
                  'border-b border-gray-100 dark:border-gray-700',
                isError && 'bg-red-50 dark:bg-red-900/20'
              )}
            >
              <span
                className={cn(
                  'text-lg font-medium',
                  isError
                    ? 'text-red-600 dark:text-red-400'
                    : isStringWeight
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-900 dark:text-gray-100'
                )}
              >
                {formatWeight(set.weight)}
              </span>
              {set.reps && (
                <span className="text-base font-medium text-emerald-600 dark:text-emerald-400">
                  {set.reps}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
