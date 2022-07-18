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
    isBrowser,
    name,
  } = options

  const renameBundleForReactVersion = (bundle) => {
    if (!name) {
      return bundle
    }

    return bundle.replace('react', name)
  }

  const config = {
    input,
    external: [
      'react',
      'react-dom',
      'react-dom/client',
    ],
    plugins: [
      resolve(), commonjs(),
    ],
    output: {
      banner,
      name: 'CypressReact',
      file: renameBundleForReactVersion(pkg.unpkg, name),
      format,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM/client',
      },
    },
  }

  if (format === 'es') {
    config.output.file = renameBundleForReactVersion(pkg.module, name)

    if (isBrowser) {
      config.output.file = renameBundleForReactVersion(pkg.unpkg, name)
    }
  }

  if (format === 'cjs') {
    config.output.file = renameBundleForReactVersion(pkg.main, name)
  }

  console.log(`Building ${format}: ${config.output.file}`)

  config.plugins.push(
    ts({
      check: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: format === 'es',
          target: 'es5', // not sure what this should be?
          module: format === 'cjs' ? 'es2015' : 'esnext',
        },
        exclude: ['tests'],
      },
    }),
  )

  return config
}

const entries = []

for (const config of [
  { format: 'cjs' },
  { format: 'es', isBrowser: false },
  { format: 'es', isBrowser: true },
  { format: 'iife', isBrowser: true },
]) {
  entries.push(
    // Legacy API - `import { mount } from 'cypress/react'
    // Works with React 16 and 17.
    createEntry({ ...config, input: 'src/index.ts', name: 'react' }),

    // React 16
    createEntry({ ...config, input: 'src/react16.ts', name: 'react16' }),

    // React 17
    createEntry({ ...config, input: 'src/react17.ts', name: 'react17' }),

    // React 18
    createEntry({ ...config, input: 'src/react18.ts', name: 'react18' }),
  )
}

export default entries
