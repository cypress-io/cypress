'use strict'

const path = require('path')
const fs = require('fs').promises
const { builtinModules } = require('module')

// rollup and needed plugins
const rollup = require('rollup')
const commonjs = require('@rollup/plugin-commonjs')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const json = require('@rollup/plugin-json')
const { terser } = require('rollup-plugin-terser')

const nodeModules = require('../results/modules.json')
const resultsDir = path.join(__dirname, '..', 'results')
const bundleInputFile = path.join(resultsDir, 'bundle-input.js')
const bundleOutputFile = path.join(resultsDir, 'bundle.js')
const bundleMinOutputFile = path.join(resultsDir, 'bundle.min.js')

const external = new Set([
  ...builtinModules,
  //
  // Circular deps
  //

  // have to be required normally
  '@packages/ts/register',

  // breaking bundle
  '@microsoft/typescript-etw',
  'cson',
  'fsevents',
  'node-webkit-updater',
  'osx-temperature-sensor',
  'parse5-html-rewriting-stream',
  'readable-stream',
  'registry-js',
  'requirejs',
  'xmlbuilder',
  'spawn-sync',

  // non-breaking
  'glob',
])

// TODO: Not sure why those aren't captured.
// Also we had to add these to our deps to make things work
const extraModules = ['bufferutil', 'utf-8-validate']

const nodeModulesString = nodeModules
.concat(extraModules)
.filter((x) => !external.has(x))
.map((x) => `cache['${x}'] = () => require('${x}')`)
.join('\n')

const bundleInput = `
const cache = {}
${nodeModulesString}

function resolveFromCache(id) {
  const resolve = cache[id]
  return resolve == null ? null : resolve()
}
resolveFromCache.__cache__ = cache

module.exports = resolveFromCache
`

const plugins = [
  commonjs(),
  nodeResolve({
    preferBuiltins: false,
  }),
  json(),
]

const config = {
  external: Array.from(external),
  input: bundleInputFile,
  output: [
    {
      file: bundleOutputFile,
      format: 'cjs',
      exports: 'auto',
    },
    {
      file: bundleMinOutputFile,
      format: 'cjs',
      exports: 'auto',
      plugins: [terser()],
    },
  ],
  plugins,
}

;(async () => {
  try {
    await fs.writeFile(bundleInputFile, bundleInput, 'utf8')
    const bundle = await rollup.rollup(config)

    await Promise.all(config.output.map(bundle.write))
  } catch (err) {
    // eslint-disable-next-line
    console.error(err)
  }
})()
