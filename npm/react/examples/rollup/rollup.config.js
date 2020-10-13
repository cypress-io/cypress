import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'

const extensions = ['.ts', '.tsx', '.js', '.jsx']
export default [
  {
    input: './src/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
    },
    plugins: [
      nodeResolve({ extensions }),
      // make sure that this is required to process cypress-react-unit-test code
      commonjs(),
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
      babel({
        exclude: /node_modules/,
        babelHelpers: 'inline',
        extensions,
      }),
    ],
  },
]
