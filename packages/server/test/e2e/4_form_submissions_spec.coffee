bodyParser = require("body-parser")
e2e = require("../support/helpers/e2e")

HTTPS_PORT = 11112
HTTP_PORT = 11113

onServer = (app) =>
  app.use(bodyParser.urlencoded())

  app.get "/", (req, res) =>
    res
    .type('html')
    .send('<html><body><form action="/dump-body" method="POST"><input name="foo" type="text"/><input type="submit"/></form></body></html>')

  app.post "/dump-body", (req, res) =>
    res
    .type('html')
    .send(JSON.stringify(req.body))

describe "e2e <form> submissions", ->
  e2e.setup({
    servers: [
      {
        port: HTTPS_PORT
        https: true
        onServer
      },
      {
        port: HTTP_PORT
        onServer
      }
    ]
  })

  it "passes with https on localhost", ->
    e2e.exec(@, {
      config: {
        baseUrl: "https://localhost:#{HTTPS_PORT}"
      }
      spec: "form_submission_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })

  it "passes with http on localhost", ->
    e2e.exec(@, {
      config: {
        baseUrl: "http://localhost:#{HTTP_PORT}"
      }
      spec: "form_submission_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
