mime            = require("mime")
path            = require("path")
bytes           = require("bytes")
sizeOf          = require("image-size")
Promise         = require("bluebird")
dataUriToBuffer = require("data-uri-to-buffer")
Jimp            = require("jimp")
log             = require("debug")("cypress:server:screenshot")
fs              = require("./util/fs")
glob            = require("./util/glob")

RUNNABLE_SEPARATOR = " -- "
invalidCharsRe     = /[^0-9a-zA-Z-_\s]/g

## TODO: when we parallelize these builds we'll need
## a semaphore to access the file system when we write
## screenshots since its possible two screenshots with
## the same name will be written to the file system

Jimp.prototype.crop = Promise.promisify(Jimp.prototype.crop)
Jimp.prototype.getBuffer = Promise.promisify(Jimp.prototype.getBuffer)

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

module.exports = {
  copy: (src, dest) ->
    fs
    .copyAsync(src, dest, {overwrite: true})
    .catch {code: "ENOENT"}, ->
      ## dont yell about ENOENT errors

  get: (screenshotsFolder) ->
    ## find all files in all nested dirs
    screenshotsFolder = path.join(screenshotsFolder, "**", "*")

    glob(screenshotsFolder, {nodir: true})

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

    captureAndCheck()

  crop: (image, dimensions) ->
    width = Math.min(dimensions.width, image.bitmap.width)
    height = Math.min(dimensions.height, image.bitmap.height)
    log("crop to dimensions #{width} x #{height}")

    image.crop(0, 0, width, height)
    .then ->
      image.getBuffer(Jimp.AUTO)
    .then (buffer) ->
      buffer.type = image.getMIME()
      buffer

  save: (data, buffer, screenshotsFolder) ->
    ## use the screenshots specific name or
    ## simply make its name the result of the titles
    name = data.name ? data.titles.join(RUNNABLE_SEPARATOR)

    ## strip out any invalid characters out of the name
    name = name.replace(invalidCharsRe, "")

    ## join name + extension with '.'
    name = [name, mime.extension(buffer.type)].join(".")

    pathToScreenshot = path.join(screenshotsFolder, name)

    fs.outputFileAsync(pathToScreenshot, buffer)
    .then ->
      fs.statAsync(pathToScreenshot)
      .get("size")
    .then (size) ->
      dimensions = sizeOf(buffer)

      {
        size:   bytes(size, {unitSeparator: " "})
        path:   pathToScreenshot
        width:  dimensions.width
        height: dimensions.height
      }

}
