e2e = require("../support/helpers/e2e").default

describe "e2e only spec", ->
  e2e.setup()

  it "failing", ->
    e2e.exec(@, {
      spec: "only*.coffee"
      snapshot: true
    })
