wd = require("wd")
bluebird = require("bluebird")

module.exports = (options = {}, df) ->
  browser = wd.promiseChainRemote("ondemand.saucelabs.com", 80, 'brian-mann', "ab95ecc5-b788-482a-82f6-ea72e1b00b54")

  browser._hasNotified = false

  browser.on "status", (info) ->
    if not browser._hasNotified
      browser._hasNotified = true
      df.notify @sessionID, options

  browser.on "command", (eventType, command, response) ->

  browser.on "http", (meth, path, data) ->

  timeStart = Date.now()
  passed    = true

  ## should also add in the functionality to add a timeout per test
  ## so if the eclectusResults global isnt changing then we should timeout
  ## and make the global script timeout also configurable

  browser
      # debugger
    .init options, (err, arr) ->
      ## update the job with our custom batchId
      ## unless there was an erro
      if not err
        browser.sauceJobUpdate
          "custom-data":
            batchId: options.batchId
            guid:    options.guid

    .catch (err) ->
      # debugger
      browser._hasError = true
      df.reject(err)
      # browser.quit()
    # .setAsyncScriptTimeout(60*30*1000)

    .get("http://#{options.host}:#{options.port}/##{options.name}?nav=false")

    .waitFor wd.asserters.jsCondition("window.eclectusResults", true), 60*30*1000, 1000, (err, obj) ->
      ## reset passed to false if there are any failures
      passed = !obj.failed

    .fin ->
      # debugger
      # return if browser._hasError

      browser.sauceJobStatus(passed)

      timeEnd = Date.now() - timeStart
      df.resolve(browser.sessionID, timeEnd, passed)

      browser.quit()

    .done()

# Driver = require('selenium-webdriver')
# chai = require("chai");
# chaiAsPromised = require("chai-as-promised");

# chai.use(chaiAsPromised);
# chai.should();
# chaiAsPromised.transferPromiseness = wd.transferPromiseness;

# browser = wd.promiseChainRemote("ondemand.saucelabs.com", 80, 'brian-mann', "ab95ecc5-b788-482a-82f6-ea72e1b00b54")

# browser.on 'status', (info) ->
#   console.log(info);

# browser.on 'command', (meth, path, data) ->
#   console.log ' > ' + meth, path, data || ''
# browser = wd.remote()

# config =
#   browserName:'chrome'

# browser.init config, ->
#   browser.get("http://nodejs.org/", ->
#     console.log("?")
#   )
  # .title()
  # .should.become("node.js")
  # .elementById("intro")
  # .text()
  # .should.eventually.include('JavaScript runtime')
  # .nodeify(@quit)

# browser.get "http://nodejs.org/", ->
# browser.get "http://0.0.0.0:3000/#tests/real_spec.coffee", ->
  # console.log "got path"
  # browser.eval "window.location.href", (e, href) ->
    # console.log "href", href
    # browser.quit()


# driver = new Driver.Builder().withCapabilities(Driver.Capabilities['chrome']()).build()

# driver.get("http://google.com")
# .then =>
#   driver.quit()

# wd.build()