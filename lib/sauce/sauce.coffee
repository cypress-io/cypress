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

  browser
    .init options, (err, arr) ->
      ## update the job with our custom batchId
      browser.sauceJobUpdate
        "custom-data":
          batchId: options.batchId
          guid:    options.guid

      df.fail(browser.sessionID, err) if err
    .get("http://#{options.host}:#{options.port}/##{options.name}")
    # .safeEval "window.location.href", (err, res) ->
      # console.log res
    .fin ->
      timeEnd = Date.now() - timeStart
      df.resolve(browser.sessionID, timeEnd)
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