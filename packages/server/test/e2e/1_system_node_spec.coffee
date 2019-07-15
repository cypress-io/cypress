e2e = require("../support/helpers/e2e")
execa = require("execa")
Fixtures = require("../support/helpers/fixtures")

systemNode = Fixtures.projectPath("system-node")

describe "e2e system node", ->
  e2e.setup()

  it "uses system node when launching plugins file", ->
    e2e.exec(@, {
      project: systemNode
      spec: "spec.js"
      snapshot: true
      expectedExitCode: 0
    })
    .then ({ stderr }) ->
      execa.stdout("node", ["-v"])
      .then (expectedNodeVer) ->
        expectedNodeVer = expectedNodeVer.slice(1) ## v1.2.3 -> 1.2.3
        expect(stderr).to.contain("Plugin Node version: #{expectedNodeVer}")
        expect(stderr).to.contain("Plugin Electron version: undefined")
