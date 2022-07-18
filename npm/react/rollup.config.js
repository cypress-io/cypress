// CommonJS to easily share across packages
const typescript = require('@rollup/plugin-typescript')
const { default: resolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const fs = require('fs')

// eslint-disable-next-line no-restricted-syntax
const pkg = JSON.parse(fs.readFileSync('./package.json'), 'utf-8')

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
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
    output: {
      banner,
      name: 'CypressReact',
      file: pkg.unpkg,
      format,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM/client',
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

  // eslint-disable-next-line no-console
  console.log(`Building ${format}: ${config.output.file}`)

  return config
}

module.exports = [
  createEntry({ format: 'es', input: 'src/index.ts', isBrowser: false }),
  createEntry({ format: 'es', input: 'src/index.ts', isBrowser: true }),
  createEntry({ format: 'iife', input: 'src/index.ts', isBrowser: true }),
  createEntry({ format: 'cjs', input: 'src/index.ts', isBrowser: false }),
]
