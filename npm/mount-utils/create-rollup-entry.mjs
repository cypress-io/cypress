// CommonJS to easily share across packages
import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { readFileSync } from 'fs'
import dts from 'rollup-plugin-dts'

/**
 * Deep merge two objects. When both values for a key are arrays,
 * concatenate them instead of replacing.
 */
function mergeWith (target, source) {
  const result = { ...target }

  for (const key of Object.keys(source)) {
    const targetVal = result[key]
    const sourceVal = source[key]

    if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
      result[key] = targetVal.concat(sourceVal)
    } else if (
      targetVal != null && typeof targetVal === 'object' && !Array.isArray(targetVal) &&
      sourceVal != null && typeof sourceVal === 'object' && !Array.isArray(sourceVal)
    ) {
      result[key] = mergeWith(targetVal, sourceVal)
    } else {
      result[key] = sourceVal
    }
  }

  return result
}

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

    const finalConfig = mergeWith(baseConfig, config)

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
