Promise   = require "bluebird"
fs        = require "fs-extra"
path      = require "path"
jsonlint  = require "jsonlint"
check     = require "syntax-error"
coffee    = require "coffee-script"
beautify  = require("js-beautify").html
pretty    = require("js-object-pretty-print").pretty
formatter = require("jsonlint/lib/formatter").formatter

fs = Promise.promisifyAll(fs)

extensions = ".json .js .coffee .html .txt".split(" ")

## TODO: add image conversion to base64

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

    ## if we have an extension go
    ## ahead adn read in the file
    if ext = path.extname(fixture)
      @parseFile(p, fixture, ext)
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
            @parseFile(p + ext, fixture, ext)

      Promise.resolve tryParsingFile(0)

  fileExists: (p) ->
    fs.statAsync(p).bind(@)

  parseFile: (p, fixture, ext) ->
    @fileExists(p)
      .catch (err) ->
        throw new Error("No fixture exists at: #{p}")
      .then ->
        @parseFileByExtension(p, fixture, ext)

  parseFileByExtension: (p, fixture, ext) ->
    ext ?= path.extname(fixture)

    switch ext
      when ".json"   then @parseJson(p, fixture)
      when ".js"     then @parseJs(p, fixture)
      when ".coffee" then @parseCoffee(p, fixture)
      when ".html"   then @parseHtml(p, fixture)
      when ".txt"    then @parseText(p, fixture)
      else
        ## make sure to update the valid extensions
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
        throw new Error("'#{fixture}' is not a valid JavaScript object.#{err.toString()}")

  parseCoffee: (p, fixture) ->
    dc = process.env.NODE_DISABLE_COLORS

    process.env.NODE_DISABLE_COLORS = "0"

    fs.readFileAsync(p, "utf8")
      .bind(@)
      .then (str) ->
        str = coffee.compile(str, {bare: true})
        eval(str)
      .then (obj) ->
        str = pretty(obj, 2)
        fs.writeFileAsync(p, str).return(obj)
      .catch (err) ->
        throw new Error("'#{fixture} is not a valid CoffeeScript object.\n#{err.toString()}")
      .finally ->
        process.env.NODE_DISABLE_COLORS = dc

  parseHtml: (p, fixture) ->
    fs.readFileAsync(p, "utf8")
      .bind(@)
      .then (str) ->
        beautify str, {
          indent_size: 2
          extra_liners: []
        }
      .then (html) ->
        fs.writeFileAsync(p, html).return(html)

  parseText: (p, fixture) ->
    fs.readFileAsync(p, "utf8")
      .bind(@)

  copyExample: (fixturesDir) ->
    src  = path.join(process.cwd(), "lib", "scaffold", "example.json")
    dest = path.join(fixturesDir, "example.json")
    fs.copyAsync(src, dest)

  scaffold: ->
    ## we want to build out the fixturesFolder + and example file
    ## but only create the example file if the fixturesFolder doesnt
    ## exist
    ##
    ## this allows us to automatically insert the folder on existing
    ## projects (whenever they are booted) but allows the user to delete
    ## the fixtures file and not have it re-generated each time
    ##
    ## this is ideal because users who are upgrading to newer cypress version
    ## will still get the folder support enabled but existing users wont be
    ## annoyed by new example files coming into their projects unnecessarily

    {projectRoot, fixturesFolder} = @app.get("cypress")

    fixturesDir = path.join(projectRoot, fixturesFolder)

    ## if the fixtures dir doesnt exist
    ## then create it + the example fixture
    fs.statAsync(fixturesDir)
      .bind(@)
      .catch ->
        @copyExample(fixturesDir)

module.exports = Fixtures
