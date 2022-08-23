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
    plugins: [
      resolve({ preferBuiltins: true }),
      commonjs(),
      ts({
        check: false,
        tsconfigOverride: {
          compilerOptions: {
            declaration: format === 'es',
            noEmit: false,
            module: format === 'cjs' ? 'es2015' : 'esnext',
          },
        },
      }),
    ],
    output: {
      banner,
      name: 'CypressSvelte',
      file: pkg.unpkg,
      format,
      exports: 'auto',
    },
  }

  if (format === 'es') {
    config.output.file = pkg.module
  }

  if (format === 'cjs') {
    config.output.file = pkg.main
  }

  console.log(`Building ${format}: ${config.output.file}`)

  return config
}

export default [
  createEntry({ format: 'es', input: 'src/index.ts' }),
  createEntry({ format: 'cjs', input: 'src/index.ts' }),
]
