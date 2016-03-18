cp      = require("child_process")
Promise = require("bluebird")

module.exports = {
  ditto: (platform) ->
    platform.log("#zip")

    src  = platform.buildPathToApp()
    dest = platform.buildPathToZip()

    new Promise (resolve, reject) =>
      zip = "ditto -c -k --sequesterRsrc --keepParent #{src} #{dest}"
      cp.exec zip, {}, (err, stdout, stderr) ->
        return reject(err) if err

        resolve(dest)
}