e2e = require("../support/helpers/e2e")

## FIREFOX FIXME: errors slightly different and stack trace lines not replaced in snapshot
describe "e2e promises", ->
  e2e.setup()

  it "failing1", ->
    e2e.exec(@, {
      spec: "promises_spec.coffee"
      snapshot: true
      expectedExitCode: 2
    })
