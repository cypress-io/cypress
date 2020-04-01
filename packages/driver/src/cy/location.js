$Location = require("../cypress/location")
$utils = require("../cypress/utils")

create = (state) ->
  return {
    getRemoteLocation: (key, win) ->
      try
        remoteUrl = $utils.locToString(win ? state("window"))
        location  = $Location.create(remoteUrl)

        if key
          location[key]
        else
          location
      catch e
        ""
  }

module.exports = {
  create
}
