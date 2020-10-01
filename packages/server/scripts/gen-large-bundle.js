'use strict'

const { external } = require('./common')
const path = require('path')

// rollup and needed plugins
const rollup = require('rollup')
const commonjs = require('@rollup/plugin-commonjs')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const json = require('@rollup/plugin-json')
const nodeGlobals = require('rollup-plugin-node-globals')

const plugins = [
  commonjs(),
  nodeResolve({
    preferBuiltins: false,
  }),
  json(),
  nodeGlobals(),
]

const output = path.resolve(__dirname, '../../../dist/darwin/bundle.js')
const input = path.resolve(__dirname, '../../../dist/darwin/index.js')

const config = {
  external: Array.from(external),
  input,
  inlineDynamicImports: true,
  output: [
    {
      file: output,
      format: 'cjs',
      exports: 'auto',
    },
  ],
  plugins,
}

;(async () => {
  try {
    const bundle = await rollup.rollup(config)

    await Promise.all(config.output.map(bundle.write))
    // eslint-disable-next-line
    console.error({ input, output })
  } catch (err) {
    // eslint-disable-next-line
    console.error(err)
  }
})()
