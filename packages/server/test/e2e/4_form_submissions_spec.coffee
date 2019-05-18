bodyParser = require("body-parser")
e2e = require("../support/helpers/e2e")

HTTPS_PORT = 11443
HTTP_PORT = 11180

getFormHtml = (formAttrs) =>
  "<html><body><form action=\"/dump-body\" method=\"POST\" #{formAttrs}><input name=\"foo\" type=\"text\"/><input type=\"submit\"/></form></body></html>"

onServer = (app) =>
  app.use(bodyParser.text({
    type: '*/*' ## parse any content-type
  }))

  app.get "/", (req, res) =>
    res
    .type('html')
    .send(getFormHtml())

  app.get "/multipart-form-data", (req, res) =>
    res
    .type('html')
    .send(getFormHtml('enctype="multipart/form-data"'))

  app.post "/dump-body", (req, res) =>
    res
    .type('html')
    .send(req.body)

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
