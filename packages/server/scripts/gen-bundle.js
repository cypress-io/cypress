'use strict'

const path = require('path')
const fs = require('fs').promises

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

const blacklist = ['@microsoft/typescript-etw']

const bundleInput = nodeModules
.filter((x) => !blacklist.includes(x))
.map((x) => `require('${x}')`)
.join('\n')

const plugins = [
  commonjs(),
  nodeResolve({
    preferBuiltins: false,
  }),
  json(),
]

const config = {
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
