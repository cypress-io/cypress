e2e = require("../support/helpers/e2e")
execa = require("execa")
Fixtures = require("../support/helpers/fixtures")
Promise = require("bluebird")

systemNode = Fixtures.projectPath("system-node")

describe "e2e system node", ->
  e2e.setup()

  it "uses system node when launching plugins file", ->
    Promise.join(
      execa.stdout("node", ["-v"])
      execa.stdout("node", ["-e", "console.log(process.execPath)"])
      (expectedNodeVersion, expectedNodePath) =>
        expectedNodeVersion = expectedNodeVersion.slice(1) ## v1.2.3 -> 1.2.3
        e2e.exec(@, {
          project: systemNode
          config: {
            env: {
              expectedNodeVersion
              expectedNodePath
            }
          }
          spec: "spec.js"
          snapshot: true
          expectedExitCode: 0
        })
        .then ({ stderr }) ->
          expect(stderr).to.contain("Plugin Node version: #{expectedNodeVersion}")
          expect(stderr).to.contain("Plugin Electron version: undefined")
    )
