import { useEffect, useState } from 'react'
import { isPartialWeight, parseWeight } from '@/lib/parse-weight'
import { cn } from '@/lib/utils'

interface WeightInputProps {
  value: number | null
  onChange: (value: number | null) => void
  label: string
  /** Resalta la etiqueta cuando el modo activo cambia lo que se pide. */
  emphasizeLabel?: boolean
  placeholder?: string
  className?: string
}

export function WeightInput({
  value,
  onChange,
  label,
  emphasizeLabel = false,
  placeholder = 'kg',
  className,
}: WeightInputProps) {
  // El input se controla con el texto crudo, no con el número: si se controla
  // con el número, React repinta y machaca lo que se está escribiendo.
  const [text, setText] = useState(value === null ? '' : String(value))

  // Resincroniza cuando el valor cambia desde fuera (carga de localStorage,
  // cambio de modo). Compara por número, así que respeta el texto mientras
  // represente el mismo valor: `"7."` y `"7,0"` no se reescriben a `"7"`.
  useEffect(() => {
    if (parseWeight(text) !== value) {
      setText(value === null ? '' : String(value))
    }
  }, [value, text])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (!isPartialWeight(raw)) return

    setText(raw)

    const parsed = parseWeight(raw)
    // Campo vacío o solo un separador: no hay peso, y el calentamiento se
    // borra en lugar de quedarse colgado del número anterior.
    if (parsed === null) {
      onChange(null)
    } else if (parsed >= 0) {
      onChange(parsed)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        className={cn(
          'text-sm font-medium text-gray-700 dark:text-gray-300',
          emphasizeLabel && 'font-bold text-gray-900 dark:text-gray-100'
        )}
      >
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-gray-300 bg-white px-4 py-3',
          'text-lg font-medium text-gray-900',
          'placeholder:text-gray-400',
          'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
          'dark:placeholder:text-gray-500 dark:focus:border-emerald-400'
        )}
      />
    </div>
  )
}
