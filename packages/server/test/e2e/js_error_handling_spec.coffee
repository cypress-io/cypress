e2e = require("../support/helpers/e2e")

## TODO: fix this
describe.skip "e2e js error handling", ->
  e2e.setup({
    servers: {
      port: 1122
      static: true
    }
  })

  it "fails", ->
    e2e.exec(@, {
      spec: "js_error_handling_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 5
    })
