e2e = require("../helpers/e2e")

describe "e2e form submissions", ->
  e2e.setup()

  it "passing", ->
    e2e.start(@, {
      spec: "form_submission_passing_spec.coffee"
      expectedExitCode: 0
    })

  it "failing", ->
    e2e.exec(@, {
      spec: "form_submission_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("AssertionError: expected '<form>' to contain 'form success!'")