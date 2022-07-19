import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'

import pkg from './package.json'

const banner = `
/**
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} Cypress.io
 * Released under the MIT License
 */
`

function createEntry () {
  const input = 'src/index.ts'
  const format = 'es'

  const config = {
    input,
    external: [
      '@angular/core',
      '@angular/core/testing',
      '@angular/common',
      '@angular/platform-browser-dynamic/testing',
    ],
    plugins: [
      resolve(),
    ],
    output: {
      banner,
      name: 'CypressAngular',
      file: pkg.module,
      format,
      exports: 'auto',
    },
  }

  console.log(`Building ${format}: ${config.output.file}`)

  config.plugins.push(
    ts({
      check: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          target: 'es6', // not sure what this should be?
          module: 'esnext',
        },
        exclude: [],
      },
    }),
  )

  return config
}

export default [
  createEntry(),
]
