e2e = require("../support/helpers/e2e")

describe "e2e task", ->
  e2e.setup()

  it "fails", ->
    e2e.exec(@, {
      spec: "task_spec.coffee"
      snapshot: true
      expectedExitCode: 2
    })
    .then ({ stdout }) ->
      ## should include a stack trace from plugins file
      match = stdout.match(/at errors(.*)\n/)
      expect(match).not.to.be.null
      expect(match[0]).to.include("plugins/index.js")
