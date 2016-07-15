## wrapper around opn due to issues with proxyquire + istanbul
os  = require("os")
opn = require("opn")

module.exports = {
  opn: (arg, opts = {}) ->
    if os.platform() is "darwin"
      opts.args = "-R"

    opn(arg, opts)
}