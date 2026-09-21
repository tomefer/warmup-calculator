import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { t } from '@/lib/i18n'
import { calculatePressAfterPress, calculateSquatPress } from '@/lib/formulas'
import { useWeightsStore } from '@/store/weights'
import { WeightInput } from '@/components/WeightInput'
import { WarmupTable } from '@/components/WarmupTable'
import { cn } from '@/lib/utils'

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
    <div className="mx-auto max-w-md px-4 py-6">
      <WeightInput
        value={pressWeight}
        onChange={setPressWeight}
        label={altMode ? t.press.alternativeInputLabel : t.input.label}
        emphasizeLabel={altMode}
        placeholder={t.input.placeholder}
      />

      <button
        type="button"
        onClick={() => setAltMode(!altMode)}
        className={cn(
          'mt-4 w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors',
          altMode
            ? 'bg-[#1a9e75] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        )}
      >
        {t.press.alternativeButton}
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

export const Route = createFileRoute('/press')({
  component: PressPage,
})
