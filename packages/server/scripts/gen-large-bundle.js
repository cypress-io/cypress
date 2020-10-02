'use strict'

const { external } = require('./common')
const path = require('path')
const { builtinModules } = require('module')

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
  nodeGlobals({ process: false, global: false, buffer: false }),
]

const output = path.resolve(__dirname, '../../../dist/darwin/bundle.js')
// const input = path.resolve(__dirname, '../../../dist/darwin/index.test.js')
const input = path.resolve(__dirname, '../../../dist/darwin/index.js')

const appExternal = new Set([
  require.resolve('../../../dist/darwin/packages/server/lib/exception'),
])

const ext = Array.from(external).concat(Array.from(appExternal))
// eslint-disable-next-line
console.log({ external: ext.slice(builtinModules.length) })
const config = {
  external: ext,
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
