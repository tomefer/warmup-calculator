import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { t } from '@/lib/i18n'
import { calculateDeadliftAfterSquat, calculateDeadliftNoSquat } from '@/lib/formulas'
import { useWeightsStore } from '@/store/weights'
import { WeightInput } from '@/components/WeightInput'
import { WarmupTable } from '@/components/WarmupTable'
import { cn } from '@/lib/utils'

function DeadliftPage() {
  const deadliftWeight = useWeightsStore((s) => s.deadliftWeight)
  const setDeadliftWeight = useWeightsStore((s) => s.setDeadliftWeight)

  const [noSquatMode, setNoSquatMode] = useState(false)

  // Los dos modos parten del mismo dato —el peso de la serie efectiva de hoy—,
  // así que comparten peso guardado: el botón solo cambia de fórmula.
  const result = useMemo(() => {
    if (deadliftWeight === null || deadliftWeight <= 0) return null
    return noSquatMode
      ? calculateDeadliftNoSquat(deadliftWeight)
      : calculateDeadliftAfterSquat(deadliftWeight)
  }, [deadliftWeight, noSquatMode])

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <WeightInput
        value={deadliftWeight}
        onChange={setDeadliftWeight}
        label={t.input.label}
        placeholder={t.input.placeholder}
      />

      <button
        type="button"
        onClick={() => setNoSquatMode(!noSquatMode)}
        className={cn(
          'mt-4 w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors',
          noSquatMode
            ? 'bg-[#1a9e75] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        )}
      >
        {t.deadlift.alternativeButton}
      </button>

      {result && (
        <div className="mt-6">
          {result.outOfRange ? (
            <p className="text-center text-red-600 dark:text-red-400">
              {t.warmup.outOfRange}
            </p>
          ) : (
            <WarmupTable sets={result.sets} />
          )}
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/deadlift')({
  component: DeadliftPage,
})
