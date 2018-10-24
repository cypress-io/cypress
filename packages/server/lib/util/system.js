/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const os = require("os");
const Promise = require("bluebird");
const getos = Promise.promisify(require("getos"));

const getOsVersion = () =>
  Promise.try(function() {
    if (os.platform() === "linux") {
      return getos()
      .then(obj => [obj.dist, obj.release].join(" - ")).catch(err => os.release());
    } else {
      return os.release();
    }
  })
;

module.exports = {
  info() {
    return getOsVersion()
    .then(osVersion =>
      ({
        osName: os.platform(),
        osVersion,
        osCpus: os.cpus(),
        osMemory: {
          free: os.freemem(),
          total: os.totalmem()
        }
      }));
  }
};
