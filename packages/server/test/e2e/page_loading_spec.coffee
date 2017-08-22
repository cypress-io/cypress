bodyParser = require("body-parser")
e2e        = require("../support/helpers/e2e")

count = 0

onServer = (app) ->
  app.use(bodyParser.json())

  app.get "/first", (req, res) ->
    ## reset the count anytime we visit first again
    count = 0
    res.send("<html><h1>first</h1><a href='/second'>second</a></html>")

  app.get "/second", (req, res) ->
    count += 1
    res.send("<html><h1>second</h1><a href='/slow'>slow</a><span id='count'>#{count}</span></html>")

  app.get "/slow", (req, res) ->
    setTimeout ->
      res.send("<html><h1>slow</h1></html>")
    , 2000

  app.get "/form", (req, res) ->
    res.send("""
      <html>
        <iframe src="http://localhost:17170/index.html"></iframe>
        <form action="/redirected-to"></form>
      </html>
    """)

  app.get "/redirected-to", (req, res) ->
    res.send("""
      <html>
        <h1>I AM THE NEW PAGE</h1>
        <script src="http://localhost:17170/static/jquery.js"></script>
        <script>
          $.get('/cypress.json')
          $.get('/cypress.json')
          $.get('/cypress.json')
          $.get('/cypress.json')
        </script>
      </html>
    """)

  app.post "/json", (req, res) ->
    res.json({
      body: req.body
    })

  app.get "/html", (req, res) ->
    res.send("<html>content</html>")

describe "e2e page_loading", ->
  e2e.setup({
    servers: [{
      port: 1717
      onServer: onServer
    }, {
      port: 17170
      static: true
    }]
  })

  it "passes", ->
    ## this tests that __cypress.initial is set correctly whilst navigating
    ## between pages, or during cy.reload
    ## additionally this creates an edge case where after __cypress.initial is
    ## set we send an XHR which should not inject because its requested for JSON
    ## but that another XHR which is requested for html should inject

    e2e.exec(@, {
      spec: "page_loading_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
