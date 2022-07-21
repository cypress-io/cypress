// CommonJS to easily share across packages
const ts = require('rollup-plugin-typescript2')
const { default: resolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

const pkg = require('./package.json')

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
  } = options

  const config = {
    input,
    external: [
      'react',
      'react-dom',
      'react-dom/client',
    ],
    plugins: [
      resolve(),
      commonjs(),
      ts({
        check: format === 'es',
        tsconfigOverride: {
          compilerOptions: {
            declaration: format === 'es',
            target: 'es5',
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
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM/client',
      },
    },
  }

  if (format === 'es') {
    config.output.file = pkg.module
  }

  if (format === 'cjs') {
    config.output.file = pkg.main
  }

  // eslint-disable-next-line no-console
  console.log(`Building ${format}: ${config.output.file}`)

  return config
}

module.exports = [
  createEntry({ format: 'es', input: 'src/index.ts' }),
  createEntry({ format: 'cjs', input: 'src/index.ts' }),
]
