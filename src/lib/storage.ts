const STORAGE_KEYS = {
  squatWeight: 'warmup_squat_weight',
  pressWeight: 'warmup_press_weight',
  pressAltWeight: 'warmup_press_alt_weight',
  deadliftWeight: 'warmup_deadlift_weight',
} as const

export function saveWeight(
  key: keyof typeof STORAGE_KEYS,
  value: number | null
): void {
  try {
    // `null` es "el usuario ha vaciado el campo": se borra la clave en vez de
    // guardar "null", que `loadWeight` leería como un número inválido.
    if (value === null) {
      localStorage.removeItem(STORAGE_KEYS[key])
    } else {
      localStorage.setItem(STORAGE_KEYS[key], String(value))
    }
  } catch {
    // localStorage not available or quota exceeded
  }
}

export function loadWeight(key: keyof typeof STORAGE_KEYS): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[key])
    if (stored === null) return null
    const parsed = parseFloat(stored)
    return isNaN(parsed) ? null : parsed
  } catch {
    return null
  }
}
