import { create } from 'zustand'
import { saveWeight, loadWeight } from '@/lib/storage'

interface WeightsState {
  squatWeight: number | null
  pressWeight: number | null
  deadliftWeight: number | null
  setSquatWeight: (v: number | null) => void
  setPressWeight: (v: number | null) => void
  setDeadliftWeight: (v: number | null) => void
}

export const useWeightsStore = create<WeightsState>((set) => ({
  squatWeight: loadWeight('squatWeight'),
  pressWeight: loadWeight('pressWeight'),
  deadliftWeight: loadWeight('deadliftWeight'),

  setSquatWeight: (v) => {
    saveWeight('squatWeight', v)
    set({ squatWeight: v })
  },

  setPressWeight: (v) => {
    saveWeight('pressWeight', v)
    set({ pressWeight: v })
  },

  setDeadliftWeight: (v) => {
    saveWeight('deadliftWeight', v)
    set({ deadliftWeight: v })
  },
}))
