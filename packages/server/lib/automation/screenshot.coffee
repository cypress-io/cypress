log = require("debug")("cypress:server:screenshot")
screenshots = require("../screenshots")

module.exports = (screenshotsFolder) ->
  return {
    capture: (data, automate) ->
      screenshots.capture(data, automate)
      .then (details) ->
        ## if there are no details, this is part of a multipart screenshot
        ## and should not be saved
        return if not details

        screenshots.save(data, details, screenshotsFolder)
        .then (savedDetails) ->
          screenshots.afterScreenshot(data, savedDetails)
      .catch (err) ->
        screenshots.clearMultipartState()
        throw err

  }
