e2e = require("../support/helpers/e2e")

describe "e2e domain", ->
  e2e.setup({
    servers: {
      port: 4848
      static: true
    }
  })

  it "passing", ->
    e2e.exec(@, {
      spec: "domain_spec.coffee"
      hosts: "app.localhost=127.0.0.1"
      snapshot: true
      expectedExitCode: 0
    })
