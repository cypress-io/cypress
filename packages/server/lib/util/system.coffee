os = require("os")
Promise = require("bluebird")
getos = Promise.promisify(require("getos"))

getOsVersion = ->
  Promise.try ->
    if os.platform() is "linux"
      getos()
      .then (obj) ->
        [obj.dist, obj.release].join(" - ")
      .catch (err) ->
        os.release()
    else
      os.release()

module.exports = {
  info: ->
    getOsVersion()
    .then (osVersion) ->
      {
        osName: os.platform()
        osVersion: osVersion
        osCpus: os.cpus()
        osMemory: {
          free: os.freemem()
          total: os.totalmem()
        }
      }
}
