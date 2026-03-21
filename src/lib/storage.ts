const STORAGE_KEYS = {
  squatWeight: 'warmup_squat_weight',
  pressWeight: 'warmup_press_weight',
  pressAltWeight: 'warmup_press_alt_weight',
  deadliftWeight: 'warmup_deadlift_weight',
  deadliftAltWeight: 'warmup_deadlift_alt_weight',
} as const

export function saveWeight(key: keyof typeof STORAGE_KEYS, value: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], String(value))
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
