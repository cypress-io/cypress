'use strict'
// Roughly replicates https://github.com/kribblo/node-ffmpeg-installer/blob/master/index.js

const getPackage = require('./entry')
const pack = getPackage()

console.log(JSON.stringify({ version: pack.version }))
