path = require("path")
exec = require("child_process").exec

e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")
launcher = require("@packages/launcher")

absPath = (pathStr) ->
  return new Promise (resolve, reject) ->
    if path.basename(pathStr) != pathStr
      return resolve(pathStr)
    exec("which #{pathStr}", (err, stdout) ->
      if err
        return reject(err)
      resolve(stdout.trim())
    )

describe "e2e launching browsers by path", ->
  e2e.setup()

  it "fails with bad browser path", ->
    e2e.exec(@, {
      project: Fixtures.projectPath("e2e")
      spec: "simple_spec.coffee"
      browser: '/this/aint/gonna/be/found'
      snapshot: true
      expectedExitCode: 1
    })

  it "works with an installed browser path", ->
    launcher.detect().then (browsers) =>
      browsers.find (browser) =>
        browser.family == "chrome"
    .then (browser) =>
      if !browser
        throw new Error("A 'chrome' family browser must be installed for this test")
      browser.path
    ## turn binary browser names ("google-chrome") into their absolute paths
    ## so that server recognizes them as a path, not as a browser name
    .then (absPath)
    .then (foundPath) =>
      e2e.exec(@, {
        project: Fixtures.projectPath("e2e")
        spec: "simple_spec.coffee"
        browser: foundPath
        snapshot: true
        expectedExitCode: 0
      })
