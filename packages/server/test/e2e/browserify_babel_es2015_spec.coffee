e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

e2ePath = Fixtures.projectPath("e2e")

describe "e2e browserify, babel, es2015", ->
  e2e.setup({npmInstall: true})

  it "passes", ->
    e2e.exec(@, {
      spec: "browserify_babel_es2015_passing_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })

  it "fails", ->
    e2e.exec(@, {
      spec: "browserify_babel_es2015_failing_spec.js"
      snapshot: true
      expectedExitCode: 1
    })
