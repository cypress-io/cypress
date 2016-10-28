e2e = require("../helpers/e2e")

describe "e2e images", ->
  e2e.setup({
    servers: {
      port: 3636
      static: true
    }
  })

  it "passes", ->
    ## this tests that images are correctly proxied and that we are not
    ## accidentally modifying their bytes in the stream

    e2e.start(@, {
      spec: "images_spec.coffee"
      expectedExitCode: 0
    })