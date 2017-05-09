fs = require("fs")
path = require("path")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

cwd = require("../cwd")

module.exports = {
  handle: (req, res, config) ->
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate"
      "Pragma": "no-cache"
      "Expires": "0"
    })

    res.type "js"

    switch req.params.error
      when "support_folder"
        res.sendFile(cwd("lib", "util", "support_folder.js"))
}
