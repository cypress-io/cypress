_       = require "underscore"
path    = require "path"
glob    = require "glob"
Promise = require "bluebird"

Controller  = require "./controller"

class Files extends Controller
  constructor: (app) ->
    if not (@ instanceof Files)
      return new Files(app)

    if not app
      throw new Error("Instantiating controllers/remote_initial requires an app!")

    @app = app

    super

  handleFiles: (req, res) ->
    @getTestFiles().then (files) ->
      res.set "X-Files-Path", files.path
      res.json files

  handleIframe: (req, res) ->
    test = req.params[0]

    filePath = path.join(process.cwd(), "app/html/empty_inject.html")

    @getSpecs(test).bind(@).then (specs) ->
      res.render filePath, {
        title:        test
        stylesheets:  @getStylesheets()
        javascripts:  @getJavascripts()
        utilities:    @getUtilities()
        specs:        specs
      }

  convertToAbsolutePath: (files) ->
    ## make sure its an array and remap to an absolute path
    files = _([files]).flatten()
    files.map (files) ->
      if /^\//.test(files) then files else "/" + files

  getSpecs: (test) ->
    ## return the specs prefixed with /tests/
    map = (specs) ->
      _(specs).map (spec) -> "/tests/#{spec}"

    ## grab all of the specs if this is ci
    if test is "ci"
      @getTestFiles().then (specs) ->
        map _(specs).pluck("name")
    else
      ## return just this single test
      Promise.resolve map([test])

  getStylesheets: ->
    @convertToAbsolutePath @app.get("cypress").stylesheets

  getJavascripts: ->
    @convertToAbsolutePath @app.get("cypress").javascripts

  getUtilities: ->
    utils = ["iframe"]
    # utils = ["jquery", "iframe"]

    ## push sinon into utilities if enabled
    utils.push "sinon" if @app.get("cypress").sinon
    # utils.push "chai-jquery" if @app.get("cypress")["chai-jquery"]

    ## i believe fixtures can be moved to the parent since
    ## its not actually mutated within the specs
    utils.push "fixtures" if @app.get("cypress").fixtures

    utils.map (util) -> "/eclectus/js/#{util}.js"

  getTestFiles: ->
    testFolderPath = path.join(
      @app.get("cypress").projectRoot,
      @app.get("cypress").testFolder
    )

    new Promise (resolve, reject) ->
      ## grab all the js and coffee files
      glob "#{testFolderPath}/**/*.+(js|coffee)", (err, files) ->
        reject(err) if err

        ## slice off the testFolder directory(ies) (which is our test folder)
        testFolderLength = testFolderPath.split("/").length

        files = _(files).map (file) ->
          {name: file.split("/").slice(testFolderLength).join("/")}
        files.path = testFolderPath

        resolve(files)

module.exports = Files