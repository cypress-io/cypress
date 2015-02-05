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

  handle: (req, res) ->
    @getTestFiles().then (files) ->
      res.set "X-Files-Path", files.path
      res.json files

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