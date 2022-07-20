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
      resolve({ preferBuiltins: true }), commonjs(),
    ],
    output: {
      banner,
      name: 'CypressSvelte',
      file: pkg.unpkg,
      format,
      exports: 'auto',
    },
  }

  if (input === 'src/index.ts') {
    if (format === 'es') {
      config.output.file = pkg.module
    }

    if (format === 'cjs') {
      config.output.file = pkg.main
    }
  } else {
    config.output.file = input.replace(/^src\//, 'dist/')
  }

  console.log(`Building ${format}: ${config.output.file}`)

  config.plugins.push(
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
  )

  return config
}

export default [
  createEntry({ format: 'es', input: 'src/index.ts' }),
  createEntry({ format: 'cjs', input: 'src/index.ts' }),
]
