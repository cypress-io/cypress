// @ts-check
'use strict'

const fs = require('fs')

const { patch, supportsColor } = require('./entry')
patch()
console.log(JSON.stringify({ patchedCwd: fs.patchedCwd, supportsColorStdout: supportsColor.stdout }))
