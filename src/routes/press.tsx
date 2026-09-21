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

  const [altMode, setAltMode] = useState(false)

  // Los dos modos parten del mismo dato —el peso de la serie efectiva del press
  // que toca ahora—, así que comparten input y peso guardado: el botón solo
  // cambia de fórmula (y la etiqueta, para que se note que ha hecho algo).
  const result = useMemo(() => {
    if (pressWeight === null || pressWeight <= 0) return null
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
            label={altMode ? t.press.alternativeInputLabel : t.input.label}
            emphasizeLabel={altMode}
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

export const Route = createFileRoute('/press')({
  component: PressPage,
})
