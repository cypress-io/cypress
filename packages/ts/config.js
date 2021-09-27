// @ts-check
'use strict'

const tmpdir = require('os').tmpdir()
const path = require('path')
const projectBaseDir = path.join(__dirname, '../../')
const cacheDir = path.join(tmpdir, 'cypress-cache')

function createConfig () {
  return { projectBaseDir, cacheDir }
}
module.exports = { createConfig }
