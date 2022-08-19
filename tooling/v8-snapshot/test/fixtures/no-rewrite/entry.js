// @ts-check
'use strict'

const fs = require('fs')
const patch = require('./graceful-fs-polyfill')

exports.patch = function patchFs() {
  patch(fs)
}
exports.supportsColor = require('./lib/colors/lib/system/supports-colors')
