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

  it "passing", ->
    ## run both domain specs back to back to ensure
    ## that the internal server + project state is
    ## reset each time we spawn the browser
    e2e.exec(@, {
      spec: "domain*"
      snapshot: true
      expectedExitCode: 0
      config: {
        hosts
      }
    })
