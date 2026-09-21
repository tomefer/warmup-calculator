import { useEffect, useState } from 'react'
import { isPartialWeight, parseWeight } from '@/lib/parse-weight'
import { cn } from '@/lib/utils'

interface WeightInputProps {
  value: number | null
  onChange: (value: number | null) => void
  label: string
  placeholder?: string
  className?: string
}

export function WeightInput({
  value,
  onChange,
  label,
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
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Glide pone la etiqueta en 18/600 y el campo como una banda gris sin
          borde ni esquinas redondeadas. */}
      <label className="text-lg font-semibold text-[var(--foreground)]">
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full border-0 bg-[var(--field)] px-4 py-3',
          'text-base text-[var(--foreground)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]'
        )}
      />
    </div>
  )
}
