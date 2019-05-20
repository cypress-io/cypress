bodyParser = require("body-parser")
cp = require("child_process")
e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")
fs = require("fs")
multiparty = require("multiparty")
path = require("path")

SERVER_ROOT = path.join(__dirname, "..", "..")

HTTPS_PORT = 11443
HTTP_PORT = 11180

getFormHtml = (formAttrs, textValue = '') =>
  "
    <html>
      <body>
        <form method=\"POST\" #{formAttrs}>
          <input name=\"foo\" type=\"text\" value=\"#{textValue}\"/>
          <input name=\"bar\" type=\"file\"/>
          <input type=\"submit\"/>
        </form>
      </body>
    </html>
  "

onServer = (app) =>
  app.post "/verify-attachment", (req, res) =>
    form = new multiparty.Form()

    form.parse req, (err, fields, files) =>
      fixturePath = path.join(SERVER_ROOT, "test/support/fixtures/projects/e2e/cypress/fixtures", fields["foo"][0])

      cp.exec "diff #{fixturePath} #{files["bar"][0].path}", (err, stdout, stderr) =>
        receivedFileMatches = (stdout == stderr == '')

        if receivedFileMatches
          return res.send('files match')

        res.send("
          file did not match. file at #{fixturePath} did not match #{files["bar"][0].path}.<br/><hr/>
          diff stdout: #{stdout}<br/><hr/>
          diff stderr: #{stderr}
        ")

  ## all routes below this point will have bodies parsed
  app.use(bodyParser.text({
    type: '*/*' ## parse any content-type
  }))

  app.get "/", (req, res) =>
    res
    .type('html')
    .send(getFormHtml('action="/dump-body"'))

  app.get "/multipart-form-data", (req, res) =>
    res
    .type('html')
    .send(getFormHtml('action="/dump-body" enctype="multipart/form-data"'))

  app.get "/multipart-with-attachment", (req, res) =>
    res
    .type('html')
    .send(getFormHtml('action="/verify-attachment" enctype="multipart/form-data"', req.query.fixturePath))

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
      # exit: false
      # browser: "chrome"
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
