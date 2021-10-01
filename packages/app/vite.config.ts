import { makeConfig } from '../frontend-shared/vite.config'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'

export default makeConfig({
  resolve: {
    alias: {
      util: require.resolve('rollup-plugin-node-builtins/src/es6/util.js'),
      stream: require.resolve('rollup-plugin-node-builtins/src/es6/stream.js'),
      buffer: require.resolve('buffer-es6'),
      events: require.resolve('rollup-plugin-node-builtins/src/es6/events.js'),
      process: require.resolve('process-es6'),
      path: require.resolve('rollup-plugin-node-builtins/src/es6/path.js'),
      // 'mocha/lib/pending': require.resolve('mocha/lib/pending.js'),
      mocha: require.resolve('mocha/mocha.js'),
    },
  },
}, {
  plugins: [
    Layouts(),
    Pages({ extensions: ['vue'] }),
  ],
})
