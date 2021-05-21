import ts from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import image from '@rollup/plugin-image'
import copy from 'rollup-plugin-copy'

import { replaceTscAliasPaths } from 'tsc-alias'

import pkg from './package.json'

const cssFolders = require('./css.folders')

const banner = `
/**
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} Cypress.io
 * Released under the MIT License
 */
`

function createEntry() {
  const config = {
    input: 'src/index.ts',
    external: ['react', 'react-dom'],
    plugins: [
      peerDepsExternal(),
      // Mirrors that in tsconfig
      ts({
        declaration: true,
        sourceMap: true,
        inlineSources: true,
      }),
      resolve(),
      json(),
      commonjs(),
      postcss({
        modules: {
          globalModulePaths: ['src/css/derived/export.scss'],
        },
        use: [
          [
            'sass',
            {
              includePaths: cssFolders,
            },
          ],
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
      {
        name: 'test',
        writeBundle: () => {
          replaceTscAliasPaths()
        },
      },
    ],
    output: {
      banner,
      name: 'CypressDesignSystem',
      dir: './dist',
      // file: pkg.module,
      format: 'es',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
      sourcemap: true,
    },
  }

  return config
}

export default [createEntry()]
