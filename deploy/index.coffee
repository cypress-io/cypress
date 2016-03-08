_        = require("lodash")
os       = require("os")
cp       = require("child_process")
path     = require("path")
chalk    = require("chalk")
Promise  = require("bluebird")
minimist = require("minimist")
meta     = require("./meta")
upload   = require("./upload")
Base     = require("./base")
Linux    = require("./linux")
Darwin   = require("./darwin")

deploy = {
  meta:   meta
  upload: upload
  Base:   Base
  Darwin: Darwin
  Linux:  Linux

  getPlatform: (platform, options) ->
    platform ?= os.platform()

    Platform = @[platform.slice(0, 1).toUpperCase() + platform.slice(1)]

    throw new Error("Platform: '#{platform}' not found") if not Platform

    options ?= @parseOptions(process.argv.slice(2))

    (new Platform(platform, options))

  parseOptions: (argv) ->
    opts = minimist(argv)
    opts.runTests = false if opts["skip-tests"]
    opts

  build: ->
    @getPlatform().build()

  zip: (platform) ->
    platform.log("#zip")

    src  = platform.buildPathToApp()
    dest = platform.buildPathToZip()

    new Promise (resolve, reject) =>
      zip = "ditto -c -k --sequesterRsrc --keepParent #{src} #{dest}"
      cp.exec zip, {}, (err, stdout, stderr) ->
        return reject(err) if err

        resolve()

  deploy: ->
    ## read off the argv
    options = @parseOptions(process.argv)

    deploy = (platform) =>
      @askDeployNewVersion()
        .then (version) =>
          options.version = version
          @deployPlatform(platform, options).then =>
            @zip(platform, options).then =>
              upload.toS3(platform)
              .then ->
                console.log chalk.bgGreen("Dist Complete")
              .catch (err) ->
                console.log chalk.bgRed("Dist Failed")
                console.log(err)

    @askWhichPlatform().bind(@).then(deploy)
}

module.exports = _.bindAll(deploy)