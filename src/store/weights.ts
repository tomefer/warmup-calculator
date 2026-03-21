import { create } from 'zustand'
import { saveWeight, loadWeight } from '@/lib/storage'

interface WeightsState {
  squatWeight: number | null
  pressWeight: number | null
  pressAltWeight: number | null
  deadliftWeight: number | null
  deadliftAltWeight: number | null
  setSquatWeight: (v: number) => void
  setPressWeight: (v: number) => void
  setPressAltWeight: (v: number) => void
  setDeadliftWeight: (v: number) => void
  setDeadliftAltWeight: (v: number) => void
}

export const useWeightsStore = create<WeightsState>((set) => ({
  squatWeight: loadWeight('squatWeight'),
  pressWeight: loadWeight('pressWeight'),
  pressAltWeight: loadWeight('pressAltWeight'),
  deadliftWeight: loadWeight('deadliftWeight'),
  deadliftAltWeight: loadWeight('deadliftAltWeight'),

  setSquatWeight: (v) => {
    saveWeight('squatWeight', v)
    set({ squatWeight: v })
  },

  setPressWeight: (v) => {
    saveWeight('pressWeight', v)
    set({ pressWeight: v })
  },

  setPressAltWeight: (v) => {
    saveWeight('pressAltWeight', v)
    set({ pressAltWeight: v })
  },

  setDeadliftWeight: (v) => {
    saveWeight('deadliftWeight', v)
    set({ deadliftWeight: v })
  },

  setDeadliftAltWeight: (v) => {
    saveWeight('deadliftAltWeight', v)
    set({ deadliftAltWeight: v })
  },
}))
