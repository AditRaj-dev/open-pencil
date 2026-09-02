import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts'
  },
  // `neutral` keeps this usable from the daemon, a worker or the browser; the
  // parsers are pure string-in/data-out and touch no platform APIs.
  platform: 'neutral',
  format: ['esm'],
  dts: true,
  sourcemap: true,
  hash: false,
  clean: true,
  outDir: './dist'
})
