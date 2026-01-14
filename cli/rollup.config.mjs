import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { readFileSync } from 'fs'
import path from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8').toString())

function external (id, parent, resolved) {
  // Bundle tslib so that we include ts helpers
  if (id === 'tslib' || id.startsWith('tslib/') || id.includes('tslib/tslib.es6.js')) {
    return false
  }

  // We only want to bundle monorepo packages that aren't published to npm separately
  if (id.includes('node_modules') && !id.startsWith('@packages/')) {
    return true
  }

  return false
}

// NOTE: cypress.ts is included here because it is the CJS "entrypoint" used by the ESM build
const inputFiles = ['lib/index.ts', 'lib/cli.ts', 'lib/cypress.ts', 'lib/exec/xvfb.ts', 'lib/exec/spawn.ts', 'lib/bin/cypress.ts']

export default [
  {
    input: inputFiles,
    external,
    output: {
      name: pkg.name,
      format: 'cjs',
      dir: 'dist',
      exports: 'named',
      entryFileNames: (chunkInfo) => {
        // Preserve directory structure for entries that need it
        // Check both the chunk name and facadeModuleId to handle different rollup behaviors
        const facadeModuleId = chunkInfo.facadeModuleId || ''
        const chunkName = chunkInfo.name || ''

        if (chunkName === 'cypress' && chunkInfo.facadeModuleId.includes('lib/bin')) {
          return 'bin/[name]'
        }

        for (const file of inputFiles) {
          const pathRelativeToLib = path.relative('lib', path.dirname(file))

          if (
            facadeModuleId.includes(file) ||
            chunkName.includes(`${pathRelativeToLib}/${path.basename(file)}`) ||
            chunkName === `${path.dirname(file)}/${path.basename(file)}`
          ) {
            return pathRelativeToLib ? `${pathRelativeToLib}/[name].js` : '[name].js'
          }
        }

        // Default behavior for other entries
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
    input: ['lib/index.mts'],
    external: false,
    output: {
      name: pkg.name,
      format: 'esm',
      dir: 'dist',
      entryFileNames (chunkInfo) {
        return '[name].mjs'
      },
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
