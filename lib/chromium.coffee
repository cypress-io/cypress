_        = require("lodash")
util     = require("util")
request  = require("request-promise")
Routes   = require("./util/routes")

class Chromium
  constructor: (win) ->
    if not (@ instanceof Chromium)
      return new Chromium(win)

    if not win
      throw new Error("Instantiating lib/chromium requires a window!")

    @win    = win
    @window = win.window

  override: (options = {}) ->
    @window.require = require

    @window.$Cypress.isHeadless = true

    ## right now we dont do anything differently
    ## in ci vs a headless run, but when ci is true
    ## we want to record the results of the run
    ## and not do anything if its headless
    # return if options.ci isnt true

    _.extend @window.Mocha.process, process

    @_reporter(@window, options.reporter)
    @_onerror(@window)
    @_log(@window)
    @_afterRun(@window, options.ci_guid)

  _reporter: (window, reporter) ->
    getReporter = ->
      switch
        when reporter is "teamcity"
          require("mocha-teamcity-reporter")

        when reporter?
          try
            require("mocha/lib/reporters/#{reporter}")
          catch
            try
              require(reporter)
            catch
              ## either pass a relative path to your reporter
              ## or include it in your package.json
              writeErr("Could not load reporter:", chalk.blue(reporter))

        else
          require("mocha/lib/reporters/spec")

    window.$Cypress.reporter = getReporter()

  _onerror: (window) ->
    # window.onerror = (err) ->
      # ## log out the error to stdout

      # ## notify Cypress API

      # process.exit(1)

  _log: (window) ->
    window.console.log = ->
      msg = util.format.apply(util, arguments)
      process.stdout.write(msg + "\n")

  _afterRun: (window, ci_guid) ->
    # takeScreenshot = (cb) =>
    #   process.stdout.write("Taking Screenshot\n")
    #   @win.capturePage (img) ->
    #     data = img.replace(/^data:image\/(png|jpg|jpeg);base64,/, "")
    #     fs.writeFile "./ss.jpg", data, "base64", (err) ->
    #       if err
    #         process.stdout.write("err + #{JSON.stringify(err)}")
    #       else
    #         cb()

    window.$Cypress.afterRun = (duration, tests) =>
      # process.stdout.write("Results are:\n")
      # process.stdout.write JSON.stringify(tests)
      # process.stdout.write("\n")
      ## notify Cypress API

      exit = ->
        failures = _.where(tests, {state: "failed"}).length

        # takeScreenshot ->
        process.exit(failures)

      if ci_guid
        request.post({
          url: Routes.tests(ci_guid)
          body: {
            duration: duration
            tests: tests
          }
          json: true
        })
        .then(exit)
        .catch(exit)
      else
        Promise.try(exit)

module.exports = Chromium
