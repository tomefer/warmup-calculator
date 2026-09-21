import { defineConfig } from 'vitest/config'
import path from 'path'

// Config propia de tests: evita cargar los plugins de router/PWA/Tailwind,
// que no pintan nada al probar las fórmulas y ralentizan el arranque.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
