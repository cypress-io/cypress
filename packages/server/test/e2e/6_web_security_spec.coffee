str = require("underscore.string")
e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/link", (req, res) ->
    res.send("<html><h1>link</h1><a href='https://www.foo.com:44665/cross_origin'>second</a></html>")

  app.get "/cross_origin", (req, res) ->
    res.send("<html><h1>cross origin</h1></html>")

  app.get "/form", (req, res) ->
    res.send("""
      <html>
        <h1>form</h1>
        <form method='POST' action='https://www.foo.com:44665/submit'>
          <input type='submit' name='foo' value='bar' />
        </form>
      </html>
    """)

  app.post "/submit", (req, res) ->
    res.redirect("https://www.foo.com:44665/cross_origin")

  app.get "/javascript", (req, res) ->
    res.send("""
      <html>
        <script type='text/javascript'>
          window.redirect = function(){
            debugger
            window.location.href = 'https://www.foo.com:44665/cross_origin'
          }
        </script>
        <h1>javascript</h1>
        <button onclick='redirect()'>click me</button>
      </html>
    """)

describe "e2e web security", ->
  require("mocha-banner").register()

  context "when enabled", ->
    e2e.setup({
      servers: [{
        port: 4466
        onServer: onServer
      }, {
        port: 44665
        https: true
        onServer: onServer
      }]
      settings: {
        hosts: {
          "*.foo.com": "127.0.0.1"
        }
      }
    })

    e2e.it "fails", {
      spec: "web_security_spec.coffee"
      snapshot: true
      expectedExitCode: 3
    }

  context "when disabled", ->
    e2e.setup({
      servers: [{
        port: 4466
        onServer: onServer
      }, {
        port: 44665
        https: true
        onServer: onServer
      }]
      settings: {
        chromeWebSecurity: false
        hosts: {
          "*.foo.com": "127.0.0.1"
        }
      }
    })

    e2e.it "passes", {
      spec: "web_security_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    }
