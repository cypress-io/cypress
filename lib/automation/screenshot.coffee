screenshots = require("../screenshots")

module.exports = (screenshotsFolder) ->
  return {
    capture: (data, automate) ->
      automate(data)
      .then (dataUrl) ->
        screenshots.save(data, dataUrl, screenshotsFolder)
  }
