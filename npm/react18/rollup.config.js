import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

import pkg from './package.json'

const banner = `
/**
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} Cypress.io
 * Released under the MIT License
 */
`

function createEntry (options) {
  const {
    format,
    input,
  } = options

  const config = {
    input,
    external: [
      'react',
      'react-dom',
      'react-dom/client',
    ],
    plugins: [
      resolve(), commonjs(),
    ],
    output: {
      banner,
      name: 'CypressReact',
      format,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM/client',
      },
    },
  }

  if (format === 'es') {
    config.output.file = pkg.module
  }

  if (format === 'cjs') {
    config.output.file = pkg.main
  }

  // eslint-disable-next-line no-console
  console.log(`Building ${format}: ${config.output.file}`)

  config.plugins.push(
    ts({
      check: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: format === 'es',
          target: 'es5', // not sure what this should be?
          module: format === 'cjs' ? 'es2015' : 'esnext',
        },
        exclude: ['tests'],
      },
    }),
  )

  return config
}

const entries = []

for (const format of ['cjs', 'es']) {
  entries.push(
    createEntry({ format, input: 'src/index.ts', name: 'react' }),
  )
}

export default entries
