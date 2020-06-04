e2e = require("../support/helpers/e2e").default

describe "e2e window.open", ->
  e2e.setup()

  # skipping this for now due to
  # snap-shot-it monkey patching
  # causing test failures
  it.skip "passes", ->
    e2e.exec(@, {
      spec: "window_open_spec.coffee"
      snapshot: true
    })
