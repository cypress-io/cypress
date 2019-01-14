e2e = require("../support/helpers/e2e")

describe.skip "e2e window.open", ->
  e2e.setup()

  ## skipping this for now due to
  ## snap-shot-it monkey patching
  ## .only causing test failures
  # it "passes", ->
  #   e2e.exec(@, {
  #     spec: "window_open_spec.coffee"
  #     snapshot: true
  #     expectedExitCode: 0
  #   })
