const isInstalledGlobally = require('is-installed-globally')

module.exports = {
  cwd () {
    return process.cwd()
  },

  exit (code) {
    process.exit(code)
  },

  failGracefully () {
    process.exit(1)
  },

  isInstalledGlobally () {
    return isInstalledGlobally
  },
}
