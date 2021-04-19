import ts from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import pkg from './package.json'
import image from '@rollup/plugin-image'
import copy from 'rollup-plugin-copy'

const cssFolders = require('./css.folders')

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
    isBrowser,
  } = options

  const config = {
    input,
    external: [
      'react',
      'react-dom',
    ],
    plugins: [
      peerDepsExternal(),
      ts({
        // check: format === 'es' && isBrowser,
        declaration: format === 'es',
        target: 'es5', // not sure what this should be?
        module: format === 'cjs' ? 'es2015' : 'esnext',
      }),
      resolve(),
      json(),
      commonjs(),
      postcss({
        modules: {
          globalModulePaths: ['src/css/derived/export.scss'],
        },
        use: [
          ['sass', {
            includePaths: cssFolders,
          }],
        ],
      }),
      image(),
      copy({
        targets: [
          // Purposefully ignore global.scss to prevent direct imports
          {
            src: './src/index.scss',
            dest: './dist',
          },
          // Purposefully ignore `derived` directory SASS
          {
            src: './src/css/*.scss',
            dest: './dist/css',
          },
          {
            src: './src/css/derived/*.d.ts',
            dest: './dist/css/derived',
          },
        ],
      }),
    ],
    output: {
      banner,
      name: 'CypressDesignSystem',
      file: pkg.unpkg,
      format,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
  }

  if (format === 'es') {
    config.output.file = pkg.module
    if (isBrowser) {
      config.output.file = pkg.unpkg
    }
  }

  if (format === 'cjs') {
    config.output.file = pkg.main
  }

  /* eslint-disable no-console */
  console.log(`Building ${format}: ${config.output.file}`)

  return config
}

export default [
  createEntry({ format: 'es', input: 'src/index.ts', isBrowser: false }),
  createEntry({ format: 'es', input: 'src/index.ts', isBrowser: true }),
  createEntry({ format: 'iife', input: 'src/index.ts', isBrowser: true }),
  createEntry({ format: 'cjs', input: 'src/index.ts', isBrowser: false }),
]
