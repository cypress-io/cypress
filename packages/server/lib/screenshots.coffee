fs              = require("fs-extra")
mime            = require("mime")
path            = require("path")
bytes           = require("bytes")
sizeOf          = require("image-size")
Promise         = require("bluebird")
dataUriToBuffer = require("data-uri-to-buffer")

fs   = Promise.promisifyAll(fs)
glob            = require("./util/glob")

RUNNABLE_SEPARATOR = " -- "
invalidCharsRe     = /[^0-9a-zA-Z-_\s]/g

## TODO: when we parallelize these builds we'll need
## a semaphore to access the file system when we write
## screenshots since its possible two screenshots with
## the same name will be written to the file system

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

  save: (data, dataUrl, screenshotsFolder) ->
    buffer = dataUriToBuffer(dataUrl)

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
