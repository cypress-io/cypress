fs      = require("fs")
path    = require("path")
Xvfb    = require("xvfb")
vagrant = require("vagrant")
Promise = require("bluebird")
Base    = require("./base")

fs = Promise.promisifyAll(fs)

vagrant.debug = true
["rsync", "rsync-auto", "rsync-back"].forEach (cmd) ->
  vagrant[cmd] = vagrant._runWithArgs(cmd)

class Linux extends Base
  buildPathToApp: ->
    path.join @buildPathToAppFolder(), "Cypress"

  buildPathToAppExecutable: ->
    path.join @buildPathToApp(), "Cypress"

  buildPathToAppResources: ->
    path.join @buildPathToApp(), "resources", "app"

  codeSign: ->
    Promise.resolve()

  getBuildDest: (pathToBuild, platform) ->
    ## returns ./build/linux/Cypress
    path.join path.dirname(pathToBuild), platform, "Cypress"

  afterBuild: (pathToBuilds) ->
    return Promise.resolve()

  runProjectTest: ->
    @_runProjectTest()
    .catch (err) =>
      @tryXvfb(@_runProjectTest)

  tryXvfb: (p) ->
    xvfb = new Xvfb()
    xvfb = Promise.promisifyAll(xvfb)
    xvfb.startAsync()
    .then (xvfxProcess) =>
      Promise.bind(@).try(p)
      .finally ->
        xvfb.stopAsync()

  runSmokeTest: ->
    ## if we fail assume perhaps
    ## its due to not starting xvfb
    @_runSmokeTest()
    .catch =>
      @tryXvfb(@_runSmokeTest)

  npm: ->
    new Promise (resolve, reject) ->
      vagrant.ssh ["-c", "cd /cypress-app && npm install"], (code) ->
        if code isnt 0
          reject("vagrant.rsync failed!")
        else
          resolve()

  rsync: ->
    new Promise (resolve, reject) ->
      vagrant.rsync (code) ->
        if code isnt 0
          reject("vagrant.rsync failed!")
        else
          resolve()

  rsyncBack: ->
    new Promise (resolve, reject) ->
      vagrant["rsync-back"] (code) ->
        if code isnt 0
          reject("vagrant.rsync-back failed!")
        else
          resolve()

  deploy: ->
    version = @options.version

    getOpts = =>
      if @options.runTests is false
        "--skip-tests"
      else
        ""

    deploy = =>
      new Promise (resolve, reject) =>
        ssh = ->
          vagrant.ssh ["-c", "cd /cypress-app && gulp dist --version #{version} #{getOpts()}"], (code) ->
            if code isnt 0
              reject("vagrant.ssh gulp dist failed!")
            else
              resolve()

        vagrant.status (code) ->
          if code isnt 0
            vagrant.up (code) ->
              reject("vagrant.up failed!") if code isnt 0
              ssh()
          else
            ssh()

    @rsync()
      .bind(@)
      .then(@npm)
      .then(deploy)
      .then(@rsyncBack)

module.exports = Linux