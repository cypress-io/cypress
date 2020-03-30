e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

e2ePath = Fixtures.projectPath("e2e")

describe "e2e browserify, babel, es2015", ->
  e2e.setup({npmInstall: true})

  it "passes", ->
    e2e.exec(@, {
      spec: "browserify_babel_es2015_passing_spec.coffee"
      snapshot: true
      noTypeScript: true
    })

  it "fails", ->
    e2e.exec(@, {
      spec: "browserify_babel_es2015_failing_spec.js"
      snapshot: true
      expectedExitCode: 1
      noTypeScript: true
    })

describe "e2e typescript", ->
  e2e.setup({npmInstall: true})

  it "spec passes", ->
    e2e.exec(@, {
      spec: "browserify_typescript_passing_spec.ts"
      snapshot: true
    })

  it "spec fails", ->
    e2e.exec(@, {
      spec: "browserify_typescript_failing_spec.ts"
      snapshot: true
      expectedExitCode: 1
    })
  
  it "project passes", ->
    projPath = Fixtures.projectPath("ts-proj")

    e2e.exec(@, {
      project: projPath
      snapshot: true
    })