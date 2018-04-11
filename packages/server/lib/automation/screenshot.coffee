dataUriToBuffer = require("data-uri-to-buffer")
Jimp = require("jimp")
Promise = require("bluebird")
log = require("debug")("cypress:server:screenshot")
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
        log("capture and check attempt ##{tries}")

        automate(data)
        .then (dataUrl) ->
          buffer = dataUriToBuffer(dataUrl)
          Jimp.read(buffer).then (image) ->
            hasPixels = hasHelperPixels(image)
            if tries < 10 and (
              (data.appOnly and hasPixels) or 
              (not data.appOnly and not hasPixels)
            )
              log("pixels still present - try again")
              return captureAndCheck()
            else
              if tries >= 10
                log("too many tries - accept latest capture")
              else
                log("succeeded taking capture")
              return [buffer, image]

      captureAndCheck().then ([buffer, image]) ->
        save = (buffer) ->
          log("save to", screenshotsFolder)
          screenshots.save(data, buffer, screenshotsFolder)

        image.crop = Promise.promisify(image.crop.bind(image))
        image.getBuffer = Promise.promisify(image.getBuffer.bind(image))

        if data.appOnly
          width = Math.min(data.viewport.width, image.bitmap.width)
          height = Math.min(data.viewport.height, image.bitmap.height)
          log("crop to dimensions #{width} x #{height}")

          image.crop(0, 0, width, height)
          .then ->
            image.getBuffer(Jimp.AUTO)
          .then (buffer) ->
            buffer.type = image.getMIME()
            save(buffer)
        else
          save(buffer)

  }
