fs              = require("fs-extra")
mime            = require("mime")
path            = require("path")
bytes           = require("bytes")
dataUriToBuffer = require("data-uri-to-buffer")

## TODO: when we parallelize these builds we'll need
## a semaphore to access the file system when we write
## screenshots since its possible two screenshots with
## the same name will be written to the file system

module.exports = {
  take: (name, dataUrl, screenshotFolder) ->
    buffer = dataUriToBuffer(dataUrl)

    ## join name + extension with '.'
    name = [name, mime.extension(buffer.type)].join(".")

    pathToScreenshot = path.join(screenshotFolder, name)

    fs.writeFileAsync(pathToScreenshot, buffer)
    .then ->
      fs.statAsync(pathToScreenshot)
      .get("size")
    .then (size) ->
      {
        size: bytes(size, {unitSeparator: " "})
        path: pathToScreenshot
      }

}