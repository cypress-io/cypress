log = require("debug")("cypress:server:screenshot")
screenshots = require("../screenshots")

module.exports = (screenshotsFolder) ->
  return {
    capture: (data, automate) ->
      screenshots.capture(data, automate)
      .then ([buffer, image]) ->
        save = (buffer) ->
          log("save to", screenshotsFolder)
          screenshots.save(data, buffer, screenshotsFolder)

        if data.appOnly
          screenshots.crop(image, data.viewport).then (buffer) ->
            save(buffer)
        else
          save(buffer)

  }
