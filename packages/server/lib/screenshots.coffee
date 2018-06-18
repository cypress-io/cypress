_               = require("lodash")
mime            = require("mime")
path            = require("path")
Promise         = require("bluebird")
dataUriToBuffer = require("data-uri-to-buffer")
Jimp            = require("jimp")
sizeOf          = require("image-size")
colorString     = require("color-string")
debug           = require("debug")("cypress:server:screenshot")
fs              = require("./util/fs")
glob            = require("./util/glob")
pathHelpers     = require("./util/path_helpers")

RUNNABLE_SEPARATOR = " -- "
pathSeparatorRe = /[\\\/]/g
invalidCharsRe = /[^0-9a-zA-Z-_\s\(\)]/g

## internal id incrementor
__ID__ = null

## TODO: when we parallelize these builds we'll need
## a semaphore to access the file system when we write
## screenshots since its possible two screenshots with
## the same name will be written to the file system

replaceInvalidChars = (str) ->
  str.replace(invalidCharsRe, "")

## when debugging logs automatically prefix the
## screenshot id to the debug logs for easier association
debug = _.wrap debug, (fn, str, args...) ->
  fn("(#{__ID__}) #{str}", args...)

isBlack = (rgba) ->
  "#{rgba.r}#{rgba.g}#{rgba.b}" is "000"

isWhite = (rgba) ->
  "#{rgba.r}#{rgba.g}#{rgba.b}" is "255255255"

intToRGBA = (int) ->
  obj = Jimp.intToRGBA(int)

  if debug.enabled
    obj.name = colorString.to.keyword([
      obj.r,
      obj.g,
      obj.b
    ])

  obj

## when we hide the runner UI for an app or fullPage capture
## the browser doesn't paint synchronously, it can take 100+ ms
## to ensure that the runner UI has been hidden, we put
## pixels in the corners of the runner UI like so:
##
##  -------------
## |g w         w|  w = white
## |w            |  g = grey
## |             |  b = black
## |w           b|
##  -------------
##
## when taking an 'app' or 'fullPage' capture, we ensure that the pixels
## are NOT there before accepting the screenshot
## when taking a 'runner' capture, we ensure the pixels ARE there

hasHelperPixels = (image, pixelRatio) ->
  topLeft = intToRGBA(image.getPixelColor(0, 0))
  topLeftRight = intToRGBA(image.getPixelColor(1 * pixelRatio, 0))
  topLeftDown = intToRGBA(image.getPixelColor(0, 1 * pixelRatio))
  bottomLeft = intToRGBA(image.getPixelColor(0, image.bitmap.height))
  topRight = intToRGBA(image.getPixelColor(image.bitmap.width, 0))
  bottomRight = intToRGBA(image.getPixelColor(image.bitmap.width, image.bitmap.height))

  topLeft.isNotWhite = not isWhite(topLeft)
  topLeftRight.isWhite = isWhite(topLeftRight)
  topLeftDown.isWhite = isWhite(topLeftDown)
  bottomLeft.isWhite = isWhite(bottomLeft)
  topRight.isWhite = isWhite(topRight)
  bottomRight.isBlack = isBlack(bottomRight)

  debug("helper pixels \n %O", {
    topLeft
    topLeftRight
    topLeftDown
    bottomLeft
    topRight
    bottomRight
  })

  return (
    topLeft.isNotWhite and
    topLeftRight.isWhite and
    topLeftDown.isWhite and
    bottomLeft.isWhite and
    topRight.isWhite and
    bottomRight.isBlack
  )

captureAndCheck = (data, automate, conditionFn) ->
  start = new Date()
  tries = 0
  do attempt = ->
    tries++
    totalDuration = new Date() - start
    debug("capture and check %o", { tries, totalDuration })

    takenAt = new Date().toJSON()

    automate(data)
    .then (dataUrl) ->
      debug("received screenshot data from automation layer", dataUrl.slice(0, 100))

      Jimp.read(dataUriToBuffer(dataUrl))
    .then (image) ->
      debug("read buffer to image #{image.bitmap.width} x #{image.bitmap.height}")

      if (totalDuration > 1500) or conditionFn(data, image)
        debug("resolving with image %o", { tries, totalDuration })
        return { image, takenAt }
      else
        attempt()

isAppOnly = (data) ->
  data.capture is "viewport" or data.capture is "fullPage"

isMultipart = (data) ->
  _.isNumber(data.current) and _.isNumber(data.total)

crop = (image, dimensions, pixelRatio = 1) ->
  debug("dimensions before are %o", dimensions)

  dimensions = _.transform dimensions, (result, value, dimension) ->
    result[dimension] = value * pixelRatio

  debug("dimensions for cropping are %o", dimensions)

  x = Math.min(dimensions.x, image.bitmap.width - 1)
  y = Math.min(dimensions.y, image.bitmap.height - 1)
  width = Math.min(dimensions.width, image.bitmap.width - x)
  height = Math.min(dimensions.height, image.bitmap.height - y)

  debug("crop: from #{x}, #{y}")
  debug("        to #{width} x #{height}")

  image.clone().crop(x, y, width, height)

pixelConditionFn = (data, image) ->
  pixelRatio = image.bitmap.width / data.viewport.width

  hasPixels = hasHelperPixels(image, pixelRatio)
  app = isAppOnly(data)

  subject = if app then "app" else "runner"

  ## if we are app, we dont need helper pixels else we do!
  passes = if app then not hasPixels else hasPixels

  debug("pixelConditionFn %o", {
    pixelRatio,
    subject,
    hasPixels,
    expectedPixels: !app
  })

  return passes

multipartImages = []

# compareUntilPixelsDiffer = (img1, img2) ->
  ## NOTE: this is for comparing pixel by pixel which is useful
  ## if you're trying to dig into the specific pixel differences
  ##
  ## we're making this as efficient as possible because
  ## there are significant performance problems
  ## getting a hash or buffer of all the image data.
  ##
  ## instead we will walk through two images comparing
  ## them pixel by pixel until they don't match.
  #
  # iterations = 0
  #
  # { width, height } = img2.bitmap
  #
  # data1 = img1.bitmap.data
  # data2 = img2.bitmap.data
  #
  # ret = (differences) ->
  #   return {
  #     iterations
  #     differences
  #   }
  #
  # for y in [0...height]
  #   for x in [0...width]
  #     iterations += 1
  #
  #     idx = (width * y + x) << 2
  #
  #     pix1 = data1.readUInt32BE(idx)
  #     pix2 = data2.readUInt32BE(idx)
  #
  #     if pix1 isnt pix2
  #       return ret([
  #         intToRGBA(pix1),
  #         intToRGBA(pix2)
  #       ])
  #
  # return ret(null)

clearMultipartState = ->
  debug("clearing %d cached multipart images", multipartImages.length)
  multipartImages = []

imagesMatch = (img1, img2) ->
  ## using Buffer::equals here
  img1.bitmap.data.equals(img2.bitmap.data)

lastImagesAreDifferent = (data, image) ->
  ## ensure the previous image isn't the same,
  ## which might indicate the page has not scrolled yet
  previous = _.last(multipartImages)
  if not previous
    debug("no previous image to compare")
    return true

  matches = imagesMatch(previous.image, image)

  debug("comparing previous and current image pixels %o", {
    previous: previous.__ID__
    matches
  })

  ## return whether or not the two images match
  ## should be true if they don't, false if they do
  return not matches

multipartConditionFn = (data, image) ->
  if data.current is 1
    pixelConditionFn(data, image) and lastImagesAreDifferent(data, image)
  else
    lastImagesAreDifferent(data, image)

stitchScreenshots = (pixelRatio) ->
  fullWidth = _
  .chain(multipartImages)
  .map("data.clip.width")
  .min()
  .multiply(pixelRatio)
  .value()

  fullHeight = _
  .chain(multipartImages)
  .sumBy("data.clip.height")
  .multiply(pixelRatio)
  .value()

  debug("stitch #{multipartImages.length} images together")

  takenAts = []
  heightMarker = 0
  fullImage = new Jimp(fullWidth, fullHeight)

  _.each multipartImages, ({ data, image, takenAt }) ->
    croppedImage = crop(image, data.clip, pixelRatio)

    debug("stitch: add image at (0, #{heightMarker})")

    takenAts.push(takenAt)
    fullImage.composite(croppedImage, 0, heightMarker)
    heightMarker += croppedImage.bitmap.height

  return { image: fullImage, takenAt: takenAts }

getType = (details) ->
  if details.buffer
    details.buffer.type
  else
    details.image.getMIME()

getBuffer = (details) ->
  if details.buffer
    Promise.resolve(details.buffer)
  else
    Promise
    .promisify(details.image.getBuffer)
    .call(details.image, Jimp.AUTO)

getDimensions = (details) ->
  pick = (obj) ->
    _.pick(obj, "width", "height")
  
  if details.buffer
    pick(sizeOf(details.buffer))
  else
    pick(details.image.bitmap)

ensureUniquePath = (takenPaths, withoutExt, extension) ->
  fullPath = "#{withoutExt}.#{extension}"
  num = 0
  while _.includes(takenPaths, fullPath)
    fullPath = "#{withoutExt} (#{++num}).#{extension}"
  return fullPath

getPath = (data, ext, screenshotsFolder) ->
  specNames = (data.specName or "")
  .split(pathSeparatorRe)
  
  if data.name
    names = data.name.split(pathSeparatorRe).map(replaceInvalidChars)
  else
    names = [data.titles.map(replaceInvalidChars).join(RUNNABLE_SEPARATOR)]
  
  ## append (failed) to the last name
  if data.testFailure
    index = names.length - 1
    names[index] = names[index] + " (failed)"
  
  withoutExt = path.join(screenshotsFolder, specNames..., names...)

  ensureUniquePath(data.takenPaths, withoutExt, ext)

getPathToScreenshot = (data, details, screenshotsFolder) ->
  ext = mime.extension(getType(details))

  getPath(data, ext, screenshotsFolder)

module.exports = {
  crop

  getPath

  clearMultipartState

  imagesMatch

  copy: (src, dest) ->
    fs
    .copyAsync(src, dest, {overwrite: true})
    .catch {code: "ENOENT"}, ->
      ## dont yell about ENOENT errors

  get: (screenshotsFolder) ->
    ## find all files in all nested dirs
    screenshotsFolder = path.join(screenshotsFolder, "**", "*")

    glob(screenshotsFolder, { nodir: true })

  capture: (data, automate) ->
    __ID__ = _.uniqueId("s")

    debug("capturing screenshot %o", data)

    ## for failure screenshots, we keep it simple to avoid latency
    ## caused by jimp reading the image buffer
    if data.simple
      takenAt = new Date().toJSON()
      return automate(data).then (dataUrl) ->
        {
          takenAt
          multipart: false
          buffer: dataUriToBuffer(dataUrl)
        }

    multipart = isMultipart(data)

    conditionFn = if multipart then multipartConditionFn else pixelConditionFn

    captureAndCheck(data, automate, conditionFn)
    .then ({ image, takenAt }) ->
      pixelRatio = image.bitmap.width / data.viewport.width

      debug("pixel ratio is", pixelRatio)

      if multipart
        debug("multi-part #{data.current}/#{data.total}")

      if multipart and data.total > 1
        ## keep previous screenshot partials around b/c if two screenshots are
        ## taken in a row, the UI might not be caught up so we need something
        ## to compare the new one to
        ## only clear out once we're ready to save the first partial for the
        ## screenshot currently being taken
        if data.current is 1
          clearMultipartState()

        debug("storing image for future comparison", __ID__)

        multipartImages.push({ data, image, takenAt, __ID__ })

        if data.current is data.total
          { image } = stitchScreenshots(pixelRatio)

          return { image, pixelRatio, multipart, takenAt }
        else
          return {}

      if isAppOnly(data) or isMultipart(data)
        image = crop(image, data.clip, pixelRatio)

      return { image, pixelRatio, multipart, takenAt }
    .then ({ image, pixelRatio, multipart, takenAt }) ->
      return null if not image

      if image and data.userClip
        image = crop(image, data.userClip, pixelRatio)

      return { image, pixelRatio, multipart, takenAt }

  save: (data, details, screenshotsFolder) ->
    pathToScreenshot = getPathToScreenshot(data, details, screenshotsFolder)

    debug("save", pathToScreenshot)

    getBuffer(details)
    .then (buffer) ->
      fs.outputFileAsync(pathToScreenshot, buffer)
    .then ->
      fs.statAsync(pathToScreenshot).get("size")
    .then (size) ->
      dimensions = getDimensions(details)

      { multipart, pixelRatio, takenAt } = details

      {
        size 
        takenAt
        dimensions
        multipart
        pixelRatio
        name: data.name
        specName: data.specName
        testFailure: data.testFailure
        path: pathToScreenshot
      }

}
