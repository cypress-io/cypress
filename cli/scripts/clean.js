const shelljs = require('shelljs')
const { includeTypes } = require('./utils')

shelljs.rm('-rf', 'build')

includeTypes.map((m) => {
  shelljs.rm('-rf', `types/${m}`)
})
