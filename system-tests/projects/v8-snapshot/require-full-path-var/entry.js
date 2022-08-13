'use strict'
// Roughly replicates https://github.com/kribblo/node-ffmpeg-installer/blob/master/index.js
const path = require('path')
const platform = 'package.json'
const npm3Path = path.resolve(__dirname, 'lib')
const packagePath = path.resolve(npm3Path, platform)
const pack = require(packagePath)

module.exports = function getPackage () {
  return pack
}
