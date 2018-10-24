/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//# wrapper around opn due to issues with proxyquire + istanbul
const os  = require("os");
const opn = require("opn");

module.exports = {
  opn(arg, opts = {}) {
    if (os.platform() === "darwin") {
      opts.args = "-R";
    }

    return opn(arg, opts);
  }
};