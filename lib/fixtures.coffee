Promise   = require "bluebird"
fs        = require "fs-extra"
path      = require "path"
jsonlint  = require "jsonlint"
check     = require "syntax-error"
pretty    = require("js-object-pretty-print").pretty
formatter = require("jsonlint/lib/formatter").formatter

fs = Promise.promisifyAll(fs)

class Fixtures
  constructor: (app) ->
    if not (@ instanceof Fixtures)
      return new Fixtures(app)

    if not app
      throw new Error("Instantiating lib/fixtures requires an app!")

    @app    = app
    @folder = path.join(@app.get("cypress").projectRoot, @app.get("cypress").fixturesFolder)

  get: (fixture) ->
    p = path.join(@folder, fixture)

    ## if fixture contains an extension
    ## attempt to immediately read the file in

    ## if fixture does not contain an extension
    ## then scan for all the files and then parse them
    ## by order of extension importance

    fs.statAsync(p)
      .bind(@)
      .catch (err) ->
        throw new Error("No file exists at: #{p}")
      .then ->
        @parseFileByExtension(p, fixture)

  parseFileByExtension: (p, fixture) ->
    ext = path.extname(fixture)

    switch ext
      when ".json" then @parseJson(p, fixture)
      when ".js"   then @parseJs(p, fixture)
      else
        throw new Error("Invalid fixture extension: '#{ext}'. Acceptable file extensions are: [json, js, coffee, jpg, jpeg, png, gif, tiff]")

  parseJson: (p, fixture) ->
    fs.readFileAsync(p, "utf8")
      .bind(@)
      .then (str) ->
        ## format the json
        formatter.formatJson(str, "  ")
      .then (json) ->
        ## write the file back even if there were errors
        ## so we write back the formatted version of the json
        fs.writeFileAsync(p, json).return(json)
      .then(jsonlint.parse)
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
      .then (obj) ->
        str = pretty(obj, 2)
        fs.writeFileAsync(p, str).return(obj)
      .catch (err) ->
        throw new Error("'#{fixture}' is not a valid JavaScript object literal.#{err.toString()}")

module.exports = Fixtures
