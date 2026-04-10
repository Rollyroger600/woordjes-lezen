import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.js'],
    include: ['tests/unit/**/*.test.js'],
    reporters: [
      'verbose',
      ['json', { outputFile: 'tests/results/vitest-results.json' }],
    ],
    coverage: {
      reporter: ['text', 'json'],
      include: ['src/**/*.js', 'src/**/*.jsx'],
      exclude: ['src/main.jsx', 'src/supabase.js', 'src/speechManifest.js'],
    },
  },
})
