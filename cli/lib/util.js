const isInstalledGlobally = require('is-installed-globally')

module.exports = {
  cwd () {
    return process.cwd()
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
