e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

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
    e2e.exec(@, {
      project: Fixtures.projectPath("e2e")
      spec: "simple_spec.coffee"
      browser: '/usr/bin/google-chrome'
      snapshot: true
      expectedExitCode: 0
    })
