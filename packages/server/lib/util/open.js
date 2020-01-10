// wrapper around opn due to issues with proxyquire + istanbul
const os = require('os')
const opn = require('opn')

module.exports = {
  opn (arg, opts = {}) {
    if (os.platform() === 'darwin') {
      opts.args = '-R'
    }

    return opn(arg, opts)
  },
}
