e2e = require("../helpers/e2e")

describe.only "e2e only spec", ->
  e2e.setup()

  it "failing", ->
    e2e.exec(@, {
      spec: "only_spec.coffee"
      expectedExitCode: 0
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("1 passing")
      expect(stdout).not.to.include("failing")
