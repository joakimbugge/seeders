import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
  plugins: [swc.vite({ jsc: { transform: { decoratorMetadata: true } } })],
  test: {
    // @ts-ignore — oxc: false disables the Oxc transformer so SWC can run exclusively
    oxc: false,
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/index.ts'],
      reporter: ['text', 'lcov'],
    },
  },
})
