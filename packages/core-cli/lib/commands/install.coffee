_             = require("lodash")
os            = require("os")
fs            = require("fs-extra")
cp            = require("child_process")
chalk         = require("chalk")
path          = require("path")
request       = require("request")
progress      = require("request-progress")
ProgressBar   = require("progress")
through2      = require("through2")
readline      = require("readline")
yauzl         = require("yauzl")
extract       = require("extract-zip")
Promise       = require("bluebird")
url           = require("url")
utils         = require("../utils")

fs = Promise.promisifyAll(fs)

baseUrl = "https://download.cypress.io/"

module.exports = {
  start: (options = {}) ->
    _.defaults options,
      displayOpen:    true
      version:        null
      cypressVersion: null
      percent:        0
      current:        0
      total:          100
      width:          30
      throttle:       100
      zipDestination: "./cypress.zip"
      destination:    utils.getDefaultAppFolder()
      executable:     utils.getPathToUserExecutable()
      after:          ->

    @initialize(options)

  initialize: (options) ->
    @download(options)
    .bind(@)
    .catch(@downloadErr)
    .then(@unzip)
    .catch(@unzipErr)
    .then ->
      @finish(options)

  downloadErr: (err) ->
    console.log("")
    console.log(chalk.bgRed.white(" -Error- "))
    console.log(chalk.red.underline("The Cypress App could not be downloaded."))
    console.log("")
    console.log("URL:", chalk.blue(@getUrl()))
    if err.statusCode
      msg = [err.statusCode, err.statusMessage].join(" - ")
      console.log("The server returned:", chalk.red(msg))
    else
      console.log(err.toString())
    console.log("")
    process.exit(1)

  unzipErr: (err) ->
    console.log("")
    console.log(chalk.bgRed.white(" -Error- "))
    console.log(chalk.red.underline("The Cypress App could not be unzipped."))
    console.log("")
    console.log(chalk.red(err.stack))
    console.log("")
    process.exit(1)

  getUrl: (version) ->
    prepend = (u) ->
      u = url.resolve(baseUrl, u)

      ## append os to url
      if o = utils.getOs()
        "#{u}?os=#{o}"
      else
        u

    if v = (version or process.env.CYPRESS_VERSION)
      prepend("desktop/#{v}")
    else
      prepend("desktop")

  download: (options) ->
    new Promise (resolve, reject) =>
      ascii = [
        chalk.white("  -")
        chalk.blue("Downloading Cypress")
        chalk.yellow("[:bar]")
        chalk.white(":percent")
        chalk.gray(":etas")
      ]

      bar = new ProgressBar(ascii.join(" "), {
        total: options.total
        width: options.width
      })

      ## nuke the bar on error
      terminate = (err) ->
        bar.clear = true
        bar.terminate()
        reject(err)

      req = request({
        url: @getUrl(options.cypressVersion)
        followRedirect: (response) ->
          if version = response.headers["x-version"]
            ## set the version in options if we have one.
            ## this insulates us from potential redirect
            ## problems where version would be set to undefined.
            options.version = version

          ## yes redirect
          return true
      })

      progress(req, {
        throttle: options.throttle
      })

      .on "response", (response) ->

        ## if our status code doesnt start with 200
        if not /^2/.test(response.statusCode)
          terminate _.pick(response, "statusCode", "statusMessage")

      .on "error", terminate

      .on "progress", (state) ->
        ## always subtract the previously percent
        ## amount since our progress notifications
        ## are only the total progress, and our
        ## progress bar expects the delta
        options.current = state.percent - options.percent
        options.percent = state.percent

        bar.tick(options.current)

      .pipe(fs.createWriteStream(options.zipDestination))

      .on "finish", ->
        ## make sure we get to 100% on the progress bar
        if diff = options.total - options.percent
          bar.tick(diff)

        resolve(options)

  unzip: (options) ->
    unzip = ->
      new Promise (resolve, reject) ->

        ascii = [
          chalk.white("  -")
          chalk.blue("Unzipping Cypress  ")
          chalk.yellow("[:bar]")
          chalk.white(":percent")
          chalk.gray(":etas")
        ]

        yauzl.open options.zipDestination, (err, zipFile) ->
          return reject(err) if err

          count = 0
          total = Math.floor(zipFile.entryCount / 500)

          bar = new ProgressBar(ascii.join(" "), {
            total: total
            width: options.width
          })

          tick = ->
            count += 1
            if count % 500 is 0
              bar.tick(1)

          ## we attempt to first unzip with the native osx
          ## ditto because its less likely to have problems
          ## with corruption, symlinks, or icons causing failures
          ## and can handle resource forks
          ## http://automatica.com.au/2011/02/unzip-mac-os-x-zip-in-terminal/
          unzipWithOsx = ->
            copyingFileRe = /^copying file/

            sp = cp.spawn "ditto", ["-xkV", options.zipDestination, options.destination]
            sp.on "error", ->
              # f-it just unzip with node
              unzipWithNode()

            sp.on "exit", (code) ->
              if code is 0
                ## make sure we get to 100% on the progress bar
                ## because reading in lines is not really accurate
                bar.tick(100)

                resolve()
              else
                unzipWithNode()

            readline.createInterface({
              input: sp.stderr
            })
            .on "line", (line) ->
              if copyingFileRe.test(line)
                tick()

          unzipWithNode = ->
            endFn = (err) ->
              return reject(err) if err

              resolve()

            obj = {
              dir: options.destination
              onEntry: tick
            }

            extract(options.zipDestination, obj, endFn)

          switch os.platform()
            when "darwin"
              unzipWithOsx()
            when "linux"
              unzipWithNode()

    ## blow away the executable if its found
    fs.statAsync(options.executable)
    .then ->
      fs.removeAsync(options.executable)
    .then(unzip)
    .catch(unzip)

  cleanupZip: (options) ->
    fs.removeAsync(options.zipDestination)

  finishedInstalling: (version) ->
    ascii = [
      chalk.white("  -")
      chalk.blue("Finished Installing")
      chalk.green(utils.getPathToUserExecutable())
      chalk.gray("(version: #{version})")
    ]

    console.log ascii.join(" ")

  displayOpeningApp: ->
    console.log("")

    ascii = [
      chalk.yellow("  You can now open Cypress by running:")
      chalk.cyan("cypress open")
    ]

    console.log ascii.join(" ")

    console.log("")

  finish: (options) ->
    @cleanupZip(options).then =>

      @finishedInstalling(options.version)

      @displayOpeningApp() if options.displayOpen

      options.after(options)

}
