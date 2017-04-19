_       = require("lodash")
fs      = require("fs-extra")
str     = require("underscore.string")
path    = require("path")
glob    = require("glob")
Promise = require("bluebird")

fs   = Promise.promisifyAll(fs)
glob = Promise.promisify(glob)

startsWithNumberAndDashRe = /(\d+-)/
excerptRe = /excerpt:.+/
newLinesRe = /\n{3,}/

LOOKUP = {
  guides: "v0.0"
  api: "v1.0"
}

getFolderFromFile = (file) ->
  ## get the parent folder by walking up one dir
  path.basename(path.resolve(file, ".."))

getNameFromFile = (file) ->
  ## get the file's name
  path.basename(file)

normalize = (string) ->
  ## strip off number + initial dash
  string = string.replace(startsWithNumberAndDashRe, "").toLowerCase()

  ## and now dasherize
  str.dasherize(string)

find = (type) ->
  folder = LOOKUP[type]

  globstar = path.join("cypress", folder, "documentation", "**", "*.md")

  glob(globstar, {
    realpath: true
  })

transfer = (type) ->
  find(type)
  .then (files = []) ->
    _.filter(files, fileStartsWithNumberAndDash)
  .map (file) ->
    name   = normalize getNameFromFile(file)
    folder = normalize getFolderFromFile(file)

    dest = path.join("source", type, folder, name)

    copy(file, dest)
    .then ->
      fs.readFileAsync(dest, "utf8")
    .then (string) ->
      ## replace slug with title
      ## remove excerpt
      string
      .replace("slug:", "title:")
      .replace(excerptRe, "---")
    .then (string) ->
      ## remove Contents up until the first ***
      contentsIndex = string.indexOf("# Contents")
      dividerIndex  = string.indexOf("***") + 3

      chunkToRemove = string.slice(contentsIndex, dividerIndex)

      ## convert multi line breaks to 2
      string
      .split(chunkToRemove)
      .join("")
      .split(newLinesRe)
      .join("\n\n")
    .then (string) ->
      fs.writeFileAsync(dest, string)

copy = (src, dest) ->
  fs.copyAsync(src, dest, {overwrite: true})

fileStartsWithNumberAndDash = (file) ->
  name = getNameFromFile(file)

  startsWithNumberAndDashRe.test(name)

transferIncomplete = ->
  find("guides")
  .then (files = []) ->
    _.reject(files, fileStartsWithNumberAndDash)
  .map (file) ->
    name   = getNameFromFile(file)
    folder = getFolderFromFile(file)

    ## move these into the source/incomplete folder
    dest = path.join("source", "incomplete", folder, name)

    copy(file, dest)

transferIncomplete()
.then ->
  Promise.all([
    transfer("api")
    transfer("guides")
  ])
