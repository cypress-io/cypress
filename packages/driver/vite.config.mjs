import { defineConfig } from 'vite'
import { join } from 'path'
import url from 'url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const driverConfig = {
  resolve: {
    alias: {
      buffer: join(__dirname, '../../node_modules', 'buffer-es6'),
      process: join(__dirname, '../../node_modules', 'process-es6'),
      path: join(__dirname, 'node_modules', 'rollup-plugin-node-builtins/src/es6/path.js'),
      setImmediate: join(__dirname, 'node_modules', 'rollup-plugin-node-builtins/src/es6/setImmediate.js'),
    },
  },
}

export default defineConfig(driverConfig)
