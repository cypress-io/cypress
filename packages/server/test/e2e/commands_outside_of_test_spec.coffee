e2e = require("../support/helpers/e2e")

describe "e2e commands outside of test", ->
  e2e.setup()

  it "passes", ->
    ## TODO: currently this doesn't actually cause mocha
    ## to fail and therefore our exit code is 0
    ## because this error is thrown in the console
    ## and cannot be properly tied to a test
    ## ---
    ## perhaps we should dynamically generate a test to
    ## associate it for stdout? how else would a user know
    ## whats going on?
    e2e.exec(@, {
      spec: "commands_outside_of_test_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
