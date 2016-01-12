wd      = require("wd")
Promise = require("bluebird")

module.exports = {
  run: (options = {}) ->
    new Promise (resolve, reject) ->
      browser = wd.promiseChainRemote("ondemand.saucelabs.com", 80, 'brian-mann', "ab95ecc5-b788-482a-82f6-ea72e1b00b54")

      browser._hasNotified = false

      browser.on "status", (info) ->
        return if browser._hasNotified
        browser._hasNotified = true

        if options.onStart
          options.onStart(@sessionID, options)

      browser.on "command", (eventType, command, response) ->

      browser.on "http", (meth, path, data) ->

      timeStart = Date.now()
      passed    = true

      ## should also add in the functionality to add a timeout per test
      ## so if the cypressResults global isnt changing then we should timeout
      ## and make the global script timeout also configurable

      browser
        .init options, (err, arr) ->
          ## update the job with our custom batchId
          ## unless there was an erro
          if not err
            browser.sauceJobUpdate
              "custom-data":
                batchId: options.batchId
                guid:    options.guid

        .catch (err) ->
          browser._hasError = true
          reject(err)
          browser.quit()

        .get(options.remoteUrl)

        .waitFor wd.asserters.jsCondition("window.cypressResults", true), 60*30*1000, 1000, (err, obj) ->
          ## reset passed to false if there are any failures
          passed = !obj.failed

        .fin ->
          browser.sauceJobStatus(passed)

          browser.quit()

          runningTime = Date.now() - timeStart
          resolve({
            sessionID: browser.sessionID
            runningTime: runningTime
            passed: passed
          })

        .done()
}