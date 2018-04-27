log = require("debug")("cypress:server:screenshot")
screenshots = require("../screenshots")

module.exports = (screenshotsFolder) ->
  return {
    capture: (data, automate) ->
      log("capture", data)

      screenshots.capture(data, automate)
      .then (buffer) ->
        if buffer
          screenshots.save(data, buffer, screenshotsFolder)
      .catch (err) ->
        screenshots.clearFullPageState()
        throw err

  }
