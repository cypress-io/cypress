e2e = require("../support/helpers/e2e")

## FIREFOX FIXME: errors slightly different and stack trace lines not replaced in snapshot
describe "e2e form submissions", ->
  e2e.setup()

  it "passing", ->
    e2e.exec(@, {
      spec: "form_submission_passing_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })

  it "failing", ->
    e2e.exec(@, {
      spec: "form_submission_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })
