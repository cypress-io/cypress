config   = require("konfig")()
path     = require "path"
fs       = require "fs-extra"
Promise  = require "bluebird"
request  = require "request-promise"

root       = process.cwd()
projects   = path.join root, "spec", "fixtures", "projects"
tmpDir     = path.join root, ".projects"

fs = Promise.promisifyAll(fs)

module.exports =
  ## copies all of the project fixtures
  ## to the tmpDir .projects in the root
  scaffold: ->
    fs.copySync projects, tmpDir

  ## removes all of the project fixtures
  ## from the tmpDir .projects in the root
  remove: ->
    fs.removeSync tmpDir

  ## returns the path to project fixture
  ## in the tmpDir
  project: (name) ->
    path.join tmpDir, name

  get: (fixture) ->
    fs.readFileSync path.join(root, "spec", "fixtures", fixture), "utf8"

  path: (fixture) ->
    path.join(root, "spec", "fixtures", fixture)

  ensureNwZip: ->
    zip = path.join(root, "spec", "fixtures", "nw", "cypress.zip")

    downloadFixture = ->
      fs.ensureDirSync zip.split("/cypress.zip").join("")

      file = fs.createWriteStream(zip)
      url  = [config.app.cdn_url, "desktop", "fixture", "cypress.zip"].join("/")

      request.get(url).pipe(file)

      new Promise (resolve, reject) ->
        file.on "finish", ->
          file.closeAsync().then(resolve)

        file.on "error", (err) ->
          fs.unlinkAsync().then ->
            reject(err)

    ## check to see if fixtures/nw/cypress.zip exist
    fs.statAsync(zip)
      ## if cypress.zip doesnt exist go download it from s3
      .catch(downloadFixture)