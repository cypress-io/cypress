'use strict'

const { strict: assert } = require('assert')
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const entryFile = require.resolve('./app')

const { packherd } = require('../../../')

if (process.env.BUNDLER == null) {
  console.error(
    'Need to provide path to bundler via "BUNDLER=<bundler> node pack-custom"'
  )
  process.exit(1)
}

const prelude = `
function get_document() {
  return document
}
function get_global() {
  return global
}
function get_window() {
  return window
}
function get_console() {
  return console
}
function get_process() {
  return process
}
`

const basedir = __dirname
const bundlerPath = process.env.BUNDLER

function outfileText(outfile) {
  // Our esbuild snapshot version sets the `contents` property to a hex string which is
  // different than what esbuild does as it sends a Uint8Array over the wire.
  return Buffer.from(outfile.contents, 'hex').toString('utf8')
}

function createBundle(opts) {
  const cmd = `${bundlerPath} --basedir=${basedir} ${opts.entryFilePath}`
  const _1GB = 1024 * 1024 * 1024
  console.log(cmd)
  const stdout = execSync(cmd, { maxBuffer: _1GB, cwd: basedir })

  const { warnings, outfiles } = JSON.parse(stdout.toString())
  assert(outfiles.length >= 2, 'need at least two outfiles, bundle and meta')
  const bundle = { text: prelude + outfileText(outfiles[0]) }
  const meta = { text: outfileText(outfiles[1]) }
  return Promise.resolve({ warnings, outputFiles: [bundle, meta] })
}

async function go() {
  let { bundle } = await packherd({ entryFile, createBundle })
  bundle += '\nmodule.exports = __commonJS'
  const p = path.join(__dirname, 'bundle.js')
  fs.writeFileSync(p, bundle, 'utf8')
  console.error('Succesfully wrote bundle to %s', p)
}
go()
