_         = require("lodash")
path      = require("path")
check     = require("syntax-error")
debug     = require("debug")("cypress:server:fixture")
coffee    = require("../../../packages/coffee")
Promise   = require("bluebird")
jsonlint  = require("jsonlint")
cwd       = require("./cwd")
errors    = require("./errors")
fs        = require("./util/fs")
glob      = require("./util/glob")

extensions = [
  ".json",
  ".js",
  ".coffee",
  ".html",
  ".txt",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".tif",
  ".tiff",
  ".zip"
]

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

    ## if the file exists, go ahead and parse it
    ## otherwise, glob for potential extensions
    @fileExists(p)
    .then ->
      debug("fixture exact name exists", p)

      ext = path.extname(fixture)
      @parseFile(p, fixture, options)
    .catch (e) ->
      if e.code != "ENOENT"
        throw e

      pattern = "#{p}{#{extensions.join(",")}}"

      glob(pattern, {
        nosort: true
        nodir: true
      }).bind(@)
      .then (matches) ->
        if matches.length == 0
          relativePath = path.relative('.', p)
          errors.throw("FIXTURE_NOT_FOUND", relativePath, extensions)

        debug("fixture matches found, using the first", matches)

        ext = path.extname(matches[0])
        @parseFile(p + ext, fixture, options)

  fileExists: (p) ->
    fs.statAsync(p).bind(@)
    .then (stat) ->
      ## check for files, not directories
      ## https://github.com/cypress-io/cypress/issues/3739
      if stat.isDirectory()
        err = new Error()
        err.code = "ENOENT"
        throw err

  parseFile: (p, fixture, options) ->
    if queue[p]
      Promise.delay(1).then =>
        @parseFile(p, fixture, options)
    else
      queue[p] = true

      cleanup = ->
        delete queue[p]

      @fileExists(p)
      .then ->
        ext = path.extname(p)
        @parseFileByExtension(p, fixture, ext, options)
      .then (ret) ->
        cleanup()

        return ret
      .catch (err) ->
        cleanup()

        throw err

  parseFileByExtension: (p, fixture, ext, options = {}) ->
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
