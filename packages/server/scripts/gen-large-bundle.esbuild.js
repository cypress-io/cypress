'use strict'

const { build } = require('esbuild')
const { external } = require('./common')
const path = require('path')
const { builtinModules } = require('module')

const output = path.resolve(__dirname, '../../../dist/darwin/bundle.js')
// const input = path.resolve(__dirname, '../../../dist/darwin/index.test.js')
const input = path.resolve(__dirname, '../../../dist/darwin/index.js')

const appExternal = new Set([
  require.resolve('../../../dist/darwin/packages/server/lib/exception'),
])

const ext = Array.from(external).concat(Array.from(appExternal))
// eslint-disable-next-line
console.log({ external: ext.slice(builtinModules.length) })

;(async () => {
  try {
    await build({
      entryPoints: [input],
      outfile: output,
      minify: false,
      bundle: true,
      platform: 'node',
      external: ext,
    })
    // eslint-disable-next-line
    console.error({ input, output })
  } catch (err) {
    // eslint-disable-next-line
    console.error(err)
  }
})()
