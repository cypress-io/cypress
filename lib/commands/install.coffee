_             = require("lodash")
fs            = require("fs")
chalk         = require("chalk")
request       = require("request")
progress      = require("request-progress")
ProgressBar   = require("progress")
Promise       = require("bluebird")
utils         = require("../utils")

url = "http://s3.amazonaws.com/dist.cypress.io/0.9.5/osx64/cypress.zip"

class Install
  constructor: (options = {}) ->
    if not (@ instanceof Install)
      return new Install(options)

    _.defaults options,
      percent:        0
      current:        0
      total:          100
      width:          30
      throttle:       300
      zipDestination: "./cypress.zip"
      destination:    utils.getDefaultAppFolder()

    @download(options).then(@unzip)

  download: (options) ->
    new Promise (resolve, reject) ->
      ascii = [
        chalk.white("1.")
        chalk.blue("Downloading Cypress")
        chalk.yellow("[:bar]")
        chalk.white(":percent")
        chalk.gray(":etas")
      ]

      bar = new ProgressBar(ascii.join(" "), {
        total: options.total
        width: options.width
      })

      progress(request(url), {
        throttle: 300
      })

      .on "progress", (state) ->
        ## always subtract the previously percent
        ## amount since our progress notifications
        ## are only the total progress, and our
        ## progress bar expects the delta
        options.current = state.percent - options.percent
        options.percent = state.percent

        bar.tick(options.current)

      .on "error", (err) ->
        reject(err)

      .pipe(fs.createWriteStream(options.zipDestination))

      .on "finish", ->
        ## make sure we get to 100% on the progress bar
        if diff = options.total - options.percent
          bar.tick(diff)

      resolve(options)

  unzip: (options) ->
    console.log "unzipping", options

module.exports = Install