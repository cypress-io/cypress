import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8').toString())

const external = [
  'lodash',
  'commander',
  'debug',
  'chalk',
  'fs-extra',
  'execa',
  'minimist',
  'bluebird',
  'listr2',
  'systeminformation',
  'yauzl',
  'extract-zip',
]

export default [
  {
    input: ['lib/index.ts', 'lib/cli.ts', 'lib/bin/cypress.ts'],
    external,
    output: {
      name: pkg.name,
      format: 'cjs',
      dir: 'dist',
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
      }),
      resolve(),
      commonjs(),
      json(),
    ],
  },
  {
    input: 'lib/index.mts',
    external,
    output: {
      name: pkg.name,
      format: 'esm',
      dir: 'dist',
      entryFileNames: 'index.mjs',
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.esm.json',
      }),
      resolve(),
      commonjs(),
      json(),
    ],
  },
]
