Base    = require("./base")

class Linux extends Base
  buildPathToApp: ->
    path.join buildDir, @getVersion(), @platform, "Cypress", "Cypress"

  buildPathToChromium: ->
    path.join @buildPathToChromiumDir(), "Chromium"

  buildPathToChromiumDir: ->
    path.join buildDir, @getVersion(), @platform, "Cypress", "bin", "chromium"

  codeSign: ->
    Promise.resolve()

  runSmokeTest: ->
    xvfb = new Xvfb()
    xvfb = Promise.promisifyAll(xvfb)
    xvfb.startAsync().then (xvfxProcess) =>
      @_runSmokeTest().then ->
        xvfb.stopAsync()

  nwBuilder: ->
    src    = path.join(buildDir, @getVersion(), @platform)
    dest   = path.join(buildDir, @getVersion(), "Cypress")
    mvDest = path.join(buildDir, @getVersion(), @platform, "Cypress")

    super.then ->
      fs.renameAsync(src, dest).then ->
        fs.ensureDirAsync(src).then ->
          fs.moveAsync(dest, mvDest, {clobber: true})

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