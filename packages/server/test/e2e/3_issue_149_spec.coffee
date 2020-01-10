fs       = require("../../lib/util/fs")
Fixtures = require("../support/helpers/fixtures")
e2e      = require("../support/helpers/e2e")

e2ePath = Fixtures.projectPath("e2e")

describe "e2e issue 149", ->
  e2e.setup()

  ## https://github.com/cypress-io/cypress/issues/149

  it "failing", ->
    e2e.exec(@, {
      spec: "issue_149_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
    .then ->
      ## the other test should have still run which should
      ## have created this file
      fs.readFileAsync(Fixtures.projectPath("e2e/foo.js"), "utf8")
    .then (str) ->
      expect(str).to.eq("bar")
