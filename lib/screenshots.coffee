fs              = require("fs-extra")
mime            = require("mime")
path            = require("path")
glob            = require("glob")
bytes           = require("bytes")
Promise         = require("bluebird")
dataUriToBuffer = require("data-uri-to-buffer")

glob = Promise.promisify(glob)

## TODO: when we parallelize these builds we'll need
## a semaphore to access the file system when we write
## screenshots since its possible two screenshots with
## the same name will be written to the file system

module.exports = {
  copy: (src, dest) ->
    dest = path.join(dest, "screenshots")

    fs
    .copyAsync(src, dest, {clobber: true})
    .catch {code: "ENOENT"}, ->
      ## dont yell about ENOENT errors

  get: (screenshotsFolder) ->
    glob(screenshotsFolder, {nodir: true})

  take: (name, dataUrl, screenshotsFolder) ->
    buffer = dataUriToBuffer(dataUrl)

    ## join name + extension with '.'
    name = [name, mime.extension(buffer.type)].join(".")

    pathToScreenshot = path.join(screenshotsFolder, name)

    fs.outputFileAsync(pathToScreenshot, buffer)
    .then ->
      fs.statAsync(pathToScreenshot)
      .get("size")
    .then (size) ->
      {
        size: bytes(size, {unitSeparator: " "})
        path: pathToScreenshot
      }

}