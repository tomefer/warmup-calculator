import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// Glide presenta el modo alternativo como una frase en negrita y debajo un
// botón teal pequeño («Dale aquí»). Allí el botón navega a otra pantalla;
// aquí alterna la fórmula, así que se marca cuando está activo.

interface AltModeButtonProps {
  prompt: string
  active: boolean
  onToggle: () => void
}

export function AltModeButton({ prompt, active, onToggle }: AltModeButtonProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-lg font-semibold text-[var(--foreground)]">{prompt}</p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
          active
            ? 'bg-primary-dark text-white ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--background)]'
            : 'bg-primary text-white hover:bg-primary-dark'
        )}
      >
        {t.altButton}
      </button>
    </div>
  )
}
