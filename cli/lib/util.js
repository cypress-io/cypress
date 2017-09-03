const path = require('path')
const isInstalledGlobally = require('is-installed-globally')
const pkg = require(path.join(__dirname, '..', '..', 'package.json'))

module.exports = {
  cwd () {
    return process.cwd()
  },

  pkgVersion () {
    return pkg.version
  },

  exit (code) {
    process.exit(code)
  },

  exit1 () {
    process.exit(1)
  },

  isInstalledGlobally () {
    return isInstalledGlobally
  },
}
