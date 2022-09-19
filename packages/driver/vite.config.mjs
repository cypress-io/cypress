import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  define: {
    // process: { env: {} },
  },

  resolve: {
    alias: {
      util: resolve('rollup-plugin-node-builtins/src/es6/util.js'),
      stream: resolve('rollup-plugin-node-builtins/src/es6/stream.js'),
      buffer: resolve('buffer-es6'),
      events: resolve('rollup-plugin-node-builtins/src/es6/events.js'),
      process: resolve('process-es6'),
      path: resolve('rollup-plugin-node-builtins/src/es6/path.js'),
      setImmediate: resolve('rollup-plugin-node-builtins/src/es6/setImmediate.js'),
      // 'mocha/lib/pending': resolve('mocha/lib/pending.js'),
      mocha: resolve('mocha/mocha.js'),
    },
  },
  optimizeDeps: {
    // include: ['mocha/lib/pending.js'],
  },
})
