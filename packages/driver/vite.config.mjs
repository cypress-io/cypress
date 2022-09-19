import { defineConfig } from 'vite'
import { resolve } from 'path'

export const driverConfig: ReturnType<defineConfig> = {
  resolve: {
    alias: {
      buffer: resolve('buffer-es6'),
      process: resolve('process-es6'),
      path: resolve('node_modules', 'rollup-plugin-node-builtins/src/es6/path.js'),
      setImmediate: resolve('rollup-plugin-node-builtins/src/es6/setImmediate.js'),
    },
  },
}

export default defineConfig(driverConfig)
