import tsPlugin from '@rollup/plugin-typescript'
import resolvePlugin from '@rollup/plugin-node-resolve'
import commonjsPlugin from '@rollup/plugin-commonjs'

export default {
  plugins: [
    resolvePlugin(),
    commonjsPlugin(),
    tsPlugin({
      module: 'esnext',
    }),
  ],
  output: {
    format: 'es',
  },
}
