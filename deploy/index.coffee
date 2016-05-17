_        = require("lodash")
os       = require("os")
chalk    = require("chalk")
Promise  = require("bluebird")
minimist = require("minimist")
zip      = require("./zip")
ask      = require("./ask")
meta     = require("./meta")
upload   = require("./upload")
Base     = require("./base")
Linux    = require("./linux")
Darwin   = require("./darwin")

success = (str) ->
  console.log chalk.bgGreen(" " + chalk.black(str) + " ")

fail = (str) ->
  console.log chalk.bgRed(" " + chalk.black(str) + " ")

deploy = {
  zip:    zip
  ask:    ask
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

  build: (platform) ->
    ## read off the argv
    options = @parseOptions(process.argv)

    @getPlatform(platform?.osName, options).build()

  release: ->
    ## read off the argv
    options = @parseOptions(process.argv)

    release = (version) =>
      upload.s3Manifest(version)
      .then ->
        success("Release Complete")
      .catch (err) ->
        fail("Release Failed")
        reject(err)

    if v = options.version
      release(v)
    else
      ask.whichRelease(meta.distDir).then(release)

  deploy: ->
    ## read off the argv
    options = @parseOptions(process.argv)

    ask.whichPlatform()
    .then (o) =>
      ask.deployNewVersion()
      .then (version) =>
        options.version = version

        @getPlatform(o, options).deploy()
      .then (platform) =>
        zip.ditto(platform)
        .then =>
          upload.toS3(platform)
          .then ->
            success("Dist Complete")
          .catch (err) ->
            fail("Dist Failed")
            console.log(err)

}

module.exports = _.bindAll(deploy, _.functions(deploy))
