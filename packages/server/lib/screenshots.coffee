_               = require("lodash")
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

captureAndCheck = (data, automate, condition) ->
  tries = 0
  attempt = ->
    tries++
    log("capture and check attempt ##{tries}")
    automate(data)
    .then (dataUrl) ->
      buffer = dataUriToBuffer(dataUrl)
      Jimp.read(buffer).then (image) ->
        if tries >= 10 or condition(data, image)
          return [buffer, image]
        else
          attempt()

  attempt()

isAppOnly = (data) ->
  data.capture is "app" or data.capture is "fullpage"

isFullPage = (data) ->
  data.capture is "fullpage"

getBufferWithType = (image) ->
  image.getBuffer(Jimp.AUTO).then (buffer) ->
    buffer.type = image.getMIME()
    buffer

crop = (image, dimensions) ->
  x = Math.min(dimensions.x, image.bitmap.width - 1)
  y = Math.min(dimensions.y, image.bitmap.height - 1)
  width = Math.min(dimensions.width, image.bitmap.width - x)
  height = Math.min(dimensions.height, image.bitmap.height - y)
  log("crop: from #{image.bitmap.width} x #{image.bitmap.height}")
  log("        to #{width} x #{height} at (#{x}, #{y})")

  image.crop(x, y, width, height)
  getBufferWithType(image)

pixelCondition = (data, image) ->
  hasPixels = hasHelperPixels(image)
  return (
    (isAppOnly(data) and not hasPixels) or
    (not isAppOnly(data) and hasPixels)
  )

fullPageImages = []

clearFullPageState = ->
  fullPageImages = []

compareLast = (image) ->
  return _.last(fullPageImages).hash() isnt image.hash()

fullPageCondition = (data, image) ->
  if data.current is 1
    pixelCondition(data, image)
  else
    compareLast(image)

stitchFullPageScreenshots = ->
  width = _.first(fullPageImages).bitmap.width
  height = _.sumBy(fullPageImages, "bitmap.height")

  fullImage = new Jimp(width, height)
  heightMarker = 0
  _.each fullPageImages, (image) ->
    fullImage.composite(image, 0, heightMarker)
    heightMarker += image.bitmap.height

  clearFullPageState()
  getBufferWithType(fullImage)

module.exports = {
  crop: crop

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
    condition = if isFullPage(data) then fullPageCondition else pixelCondition

    captureAndCheck(data, automate, condition)
    .then ([buffer, image]) ->
      if isFullPage(data) and data.total > 1
        return crop(image, data.clip).then ->
          fullPageImages.push(image)

          if data.current is data.total
            return stitchFullPageScreenshots()
          else
            return null

      if isAppOnly(data)
        return crop(image, data.clip)

      return buffer

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

  clearFullPageState: clearFullPageState

}
