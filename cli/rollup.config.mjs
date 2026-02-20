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

  // package.json needs to be loaded dynamically, so we must externalize it
  if (id.includes('package.json')) {
    return true
  }

  // node_modules are externalized by default
  if (id.includes('node_modules')) {
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
        // for entry files in lib directory, we want to keep the directory structure and filename as-is -
        // other packages break through this package's encapsulation and access the dist directory directly
        const facadeModuleId = chunkInfo.facadeModuleId || ''
        const chunkName = chunkInfo.name || ''

        if (chunkName === 'cypress' && facadeModuleId.match(/lib[\/\\]bin/g)) {
          return 'bin/[name]'
        }

        const pathRelativeToLib = path.relative('lib', path.dirname(facadeModuleId))

        const artifactDestinationPath = (pathRelativeToLib.endsWith('/') || !pathRelativeToLib.length) ? pathRelativeToLib : `${pathRelativeToLib}/`

        return pathRelativeToLib.startsWith('..') ? '[name].js' : `${artifactDestinationPath}[name].js`
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
