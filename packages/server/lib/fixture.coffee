_         = require("lodash")
path      = require("path")
check     = require("syntax-error")
coffee    = require("../../../packages/coffee")
Promise   = require("bluebird")
jsonlint  = require("jsonlint")
cwd       = require("./cwd")
fs        = require("./util/fs")

extensions = ".json .js .coffee .html .txt .csv .png .jpg .jpeg .gif .tif .tiff .zip".split(" ")

queue = {}

lastCharacterIsNewLine = (str) ->
  str[str.length - 1] is "\n"

friendlyJsonParse = (s) ->
  jsonlint.parse(s) # might throw good error
  JSON.parse(s) # actually parses correctly all the edge cases

module.exports = {
  get: (fixturesFolder, filePath, options = {}) ->
    p       = path.join(fixturesFolder, filePath)
    fixture = path.basename(p)

    ## if we have an extension go
    ## ahead and read in the file
    if ext = path.extname(p)
      @parseFile(p, fixture, ext, options)
    else
      ## change this to first glob for
      ## the files, and if nothing is found
      ## throw a better error message
      tryParsingFile = (index) =>
        ext = extensions[index]

        if not ext
          throw new Error("No fixture file found with an acceptable extension. Searched in: #{p}")

        @fileExists(p + ext)
        .catch ->
          tryParsingFile(index + 1)
        .then ->
          @parseFile(p + ext, fixture, ext, options)

      Promise.resolve tryParsingFile(0)

  fileExists: (p) ->
    fs.statAsync(p).bind(@)

  parseFile: (p, fixture, ext, options) ->
    if queue[p]
      Promise.delay(1).then =>
        @parseFile(p, fixture, ext)
    else
      queue[p] = true

      cleanup = ->
        delete queue[p]

      @fileExists(p)
      .catch (err) ->
        ## TODO: move this to lib/errors
        throw new Error("No fixture exists at: #{p}")
      .then ->
        @parseFileByExtension(p, fixture, ext, options)
      .then (ret) ->
        cleanup()

        return ret
      .catch (err) ->
        cleanup()

        throw err

  parseFileByExtension: (p, fixture, ext, options = {}) ->
    ext ?= path.extname(fixture)

    switch ext
      when ".json"   then @parseJson(p, fixture)
      when ".js"     then @parseJs(p, fixture)
      when ".coffee" then @parseCoffee(p, fixture)
      when ".html"   then @parseHtml(p, fixture)
      when ".png", ".jpg", ".jpeg", ".gif", ".tif", ".tiff", ".zip"
        @parse(p, fixture, options.encoding or "base64")
      else
        @parse(p, fixture, options.encoding)

  parseJson: (p, fixture) ->
    fs.readFileAsync(p, "utf8")
    .bind(@)
    .then(friendlyJsonParse)
    .catch (err) ->
      throw new Error("'#{fixture}' is not valid JSON.\n#{err.message}")

  parseJs: (p, fixture) ->
    fs.readFileAsync(p, "utf8")
    .bind(@)
    .then (str) ->
      try
        obj = eval("(" + str + ")")
      catch e
        err = check(str, fixture)
        throw err if err
        throw e

      return obj
    .catch (err) ->
      throw new Error("'#{fixture}' is not a valid JavaScript object.#{err.toString()}")

  parseCoffee: (p, fixture) ->
    dc = process.env.NODE_DISABLE_COLORS

    process.env.NODE_DISABLE_COLORS = "0"

    fs.readFileAsync(p, "utf8")
    .bind(@)
    .then (str) ->
      str = coffee.compile(str, {bare: true})
      eval(str)
    .catch (err) ->
      throw new Error("'#{fixture} is not a valid CoffeeScript object.\n#{err.toString()}")
    .finally ->
      process.env.NODE_DISABLE_COLORS = dc

  parseHtml: (p, fixture) ->
    fs.readFileAsync(p, "utf8")
    .bind(@)

  parse: (p, fixture, encoding = "utf8") ->
    fs.readFileAsync(p, encoding)
    .bind(@)
}
