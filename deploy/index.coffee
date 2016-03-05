_        = require("lodash")
os       = require("os")
Promise  = require("bluebird")
minimist = require("minimist")
Base     = require("./base")
Linux    = require("./linux")
Darwin   = require("./darwin")

deploy = {
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
}

module.exports = _.bindAll(deploy)