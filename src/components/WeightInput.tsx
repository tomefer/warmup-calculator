import { cn } from '@/lib/utils'

interface WeightInputProps {
  value: number | null
  onChange: (value: number) => void
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') return
    const parsed = parseFloat(raw)
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value ?? ''}
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
