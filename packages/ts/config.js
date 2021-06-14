// @ts-check
'use strict'

const path = require('path')
const projectBaseDir = path.join(__dirname, '../../')

function createConfig () {
  return { projectBaseDir }
}
module.exports = { createConfig }
