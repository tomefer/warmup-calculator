import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { t } from '@/lib/i18n'
import { calculateSquat } from '@/lib/formulas'
import { useWeightsStore } from '@/store/weights'
import { WeightInput } from '@/components/WeightInput'
import { WarmupTable } from '@/components/WarmupTable'

function SquatPage() {
  const squatWeight = useWeightsStore((s) => s.squatWeight)
  const setSquatWeight = useWeightsStore((s) => s.setSquatWeight)

  const result = useMemo(() => {
    if (squatWeight === null || squatWeight <= 0) return null
    return calculateSquat(squatWeight)
  }, [squatWeight])

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <WeightInput
        value={squatWeight}
        onChange={setSquatWeight}
        label={t.input.label}
        placeholder={t.input.placeholder}
      />

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

export const Route = createFileRoute('/squat')({
  component: SquatPage,
})
