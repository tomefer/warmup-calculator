import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { t } from '@/lib/i18n'
import { calculateDeadliftAfterSquat, calculateDeadliftNoSquat } from '@/lib/formulas'
import { useWeightsStore } from '@/store/weights'
import { WeightInput } from '@/components/WeightInput'
import { WarmupTable } from '@/components/WarmupTable'
import { PageHeader } from '@/components/PageHeader'
import { AltModeButton } from '@/components/AltModeButton'

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
    <>
      <PageHeader title={t.pageTitles.deadlift} />
      <div className="mx-auto max-w-md px-4 py-6">
        <AltModeButton
          prompt={t.deadlift.alternativePrompt}
          active={noSquatMode}
          onToggle={() => setNoSquatMode(!noSquatMode)}
        />

        <div className="mt-8">
          <WeightInput
            value={deadliftWeight}
            onChange={setDeadliftWeight}
            label={t.input.label}
            placeholder={t.input.placeholder}
          />
        </div>

        {result && (
          <div className="mt-8">
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
    </>
  )
}

export const Route = createFileRoute('/deadlift')({
  component: DeadliftPage,
})
