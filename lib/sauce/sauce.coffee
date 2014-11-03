wd = require("wd")
bluebird = require("bluebird")
browser = wd.promiseChainRemote()

module.exports = (host, port, spec, browserName, df) ->
  browser
    .init({browserName: browserName})
    .get("http://#{host}:#{port}/##{spec}")
    # .safeEval "window.location.href", (err, res) ->
      # console.log res
    .fin ->
      result = {}
      df.resolve(result)
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