import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8').toString())

function external (id) {
  // We only want to bundle monorepo packages that aren't published to npm separately
  if (pkg.dependencies[id] && !id.startsWith('@packages/')) {
    return true
  }

  return false
}

export default [
  {
    input: ['lib/index.ts', 'lib/cli.ts', 'lib/bin/cypress.ts'],
    external,
    output: {
      name: pkg.name,
      format: 'cjs',
      dir: 'dist',
      entryFileNames: (chunkInfo) => {
        console.log(chunkInfo)
        // Preserve directory structure: lib/bin/cypress.ts -> dist/bin/cypress.js
        if (chunkInfo.moduleIds.some((id) => id.includes('bin/cypress'))) {
          return 'bin/cypress.js'
        }

        // Other files: lib/index.ts -> dist/index.js, lib/cli.ts -> dist/cli.js
        return '[name].js'
      },
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
