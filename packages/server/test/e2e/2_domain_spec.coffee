e2e = require("../support/helpers/e2e")

hosts = {
  "app.localhost": "127.0.0.1"
  "foo.bar.baz.com.au": "127.0.0.1"
}

describe "e2e domain", ->
  e2e.setup({
    servers: {
      port: 4848
      static: true
    }
  })

  e2e.it "passes", {
    spec: "domain*"
    snapshot: true
    expectedExitCode: 0
    config: {
      hosts
    }
  }
