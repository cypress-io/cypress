log = require("debug")("cypress:server:screenshot")
screenshots = require("../screenshots")

module.exports = (screenshotsFolder) ->
  return {
    capture: (data, automate) ->
      log("capture %o", data)

      screenshots.capture(data, automate)
      .then (details) ->
        if details
          screenshots.save(data, details, screenshotsFolder)
      .catch (err) ->
        screenshots.clearMultipartState()
        throw err

  }
