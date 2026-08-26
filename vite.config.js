import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    // Keep memory low on developer machines
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
    isolate: true,
    teardownTimeout: 5000,
    testTimeout: 15000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/utils/**/*.js'],
    },
  },
})
