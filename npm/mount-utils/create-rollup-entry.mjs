// CommonJS to easily share across packages
import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import _ from 'lodash'
import { readFileSync } from 'fs'
import dts from 'rollup-plugin-dts'

const pkg = JSON.parse(readFileSync('./package.json'))

/** @type {(options: { formats: string[], input: string, config: {} }) => []} */
export function createEntries (options) {
  const {
    formats,
    input,
    config = {},
    dtsOptions = {},
  } = options

  const banner = `
/**
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} Cypress.io
 * Released under the MIT License
 */
`

  return formats.map((format) => {
    const baseConfig = {
      input,
      plugins: [
        resolve({ preferBuiltins: true }),
        commonjs(),
        ts({
          check: format === 'es',
          tsconfigOverride: {
            compilerOptions: {
              declaration: false,
              target: 'es6',
              module: format === 'cjs' ? 'es2015' : 'esnext',
            },
            exclude: ['tests'],
          },
        }),
      ],
      output: {
        banner,
        name: 'CypressReact',
        file: pkg.unpkg,
        format,
      },
    }

    const finalConfig = _.mergeWith({}, baseConfig, config, (objValue, srcValue) => {
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue)
      }
    })

    if (format === 'es') {
      finalConfig.output.file = pkg.module
    }

    if (format === 'cjs') {
      finalConfig.output.file = pkg.main
    }

    // eslint-disable-next-line no-console
    console.log(`Building ${format}: ${finalConfig.output.file}`)

    return finalConfig
  }).concat([{
    input,
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      dts({ respectExternal: true, ...dtsOptions }),
      {
        name: 'cypress-types-reference',
        // rollup-plugin-dts does not add '// <reference types="cypress" />' like rollup-plugin-typescript2 did so we add it here.
        renderChunk (...[code]) {
          return `/// <reference types="cypress" />\n\n${code}`
        },
      },
    ],
    external: config.external || [],
  }])
}
