dataUriToBuffer = require("data-uri-to-buffer")
Jimp = require("jimp")
Promise = require("bluebird")
screenshots = require("../screenshots")

isBlack = (rgba) ->
  "#{rgba.r}#{rgba.g}#{rgba.b}" is "000"

isWhite = (rgba) ->
  "#{rgba.r}#{rgba.g}#{rgba.b}" is "255255255"

hasHelperPixels = (image) ->
  topLeft = Jimp.intToRGBA(image.getPixelColor(0, 0))
  topLeftRight = Jimp.intToRGBA(image.getPixelColor(1, 0))
  topLeftDown = Jimp.intToRGBA(image.getPixelColor(0, 1))
  topRight = Jimp.intToRGBA(image.getPixelColor(image.bitmap.width, 0))
  bottomLeft = Jimp.intToRGBA(image.getPixelColor(0, image.bitmap.height))
  bottomRight = Jimp.intToRGBA(image.getPixelColor(image.bitmap.width, image.bitmap.height))

  return (
    isBlack(topLeft) and
    isWhite(topLeftRight) and
    isWhite(topLeftDown) and
    isWhite(topRight) and 
    isBlack(bottomRight) and 
    isWhite(bottomLeft)
  )

module.exports = (screenshotsFolder) ->
  return {
    capture: (data, automate) ->
      tries = 0
      captureAndCheck = ->
        tries++

        automate(data)
        .then (dataUrl) ->
          buffer = dataUriToBuffer(dataUrl)
          Jimp.read(buffer).then (image) ->
            hasPixels = hasHelperPixels(image)
            if (data.appOnly and hasPixels) or (not data.appOnly and not hasPixels) and tries < 10
              return captureAndCheck()
            else
              return [buffer, image]

      captureAndCheck().then ([buffer, image]) ->
        screenshots.save(data, buffer, screenshotsFolder)

        save = (buffer) ->

  }
