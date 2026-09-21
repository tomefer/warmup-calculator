import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { t } from '@/lib/i18n'
import { calculatePressAfterPress, calculateSquatPress } from '@/lib/formulas'
import { useWeightsStore } from '@/store/weights'
import { WeightInput } from '@/components/WeightInput'
import { WarmupTable } from '@/components/WarmupTable'
import { PageHeader } from '@/components/PageHeader'
import { AltModeButton } from '@/components/AltModeButton'

function PressPage() {
  const pressWeight = useWeightsStore((s) => s.pressWeight)
  const setPressWeight = useWeightsStore((s) => s.setPressWeight)
  const pressAltWeight = useWeightsStore((s) => s.pressAltWeight)
  const setPressAltWeight = useWeightsStore((s) => s.setPressAltWeight)

  const [altMode, setAltMode] = useState(false)

  const result = useMemo(() => {
    if (pressWeight === null || pressWeight <= 0) return null

    // El modo "press previo" solo cambia las repeticiones, no los pesos, así
    // que `pressAltWeight` no entra en el cálculo: se guarda como recordatorio.
    return altMode
      ? calculatePressAfterPress(pressWeight)
      : calculateSquatPress(pressWeight)
  }, [pressWeight, altMode])

  return (
    <>
      <PageHeader title={t.pageTitles.press} />
      <div className="mx-auto max-w-md px-4 py-6">
        <AltModeButton
          prompt={t.press.alternativePrompt}
          active={altMode}
          onToggle={() => setAltMode(!altMode)}
        />

        <div className="mt-8">
          <WeightInput
            value={pressWeight}
            onChange={setPressWeight}
            label={t.input.label}
            placeholder={t.input.placeholder}
          />
        </div>

        {altMode && (
          <div className="mt-6">
            <WeightInput
              value={pressAltWeight}
              onChange={setPressAltWeight}
              label={t.press.alternativeLabel}
              placeholder={t.input.placeholder}
            />
          </div>
        )}

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

export const Route = createFileRoute('/press')({
  component: PressPage,
})
