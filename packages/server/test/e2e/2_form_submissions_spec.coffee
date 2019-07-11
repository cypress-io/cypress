rp = require("request-promise")
path = require("path")
Promise = require("bluebird")
bodyParser = require("body-parser")
multiparty = require("multiparty")
fs = require("../../lib/util/fs")
e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

HTTPS_PORT = 11443
HTTP_PORT = 11180

e2ePath = Fixtures.projectPath("e2e")
pathToLargeImage = Fixtures.path("server/imgs/earth.jpg")

getFormHtml = (formAttrs, textValue = '') ->
  """
  <html>
    <body>
      <form method="POST" #{formAttrs}>
        <input name="foo" type="text" value="#{textValue}"/>
        <input name="bar" type="file"/>
        <input type="submit"/>
      </form>
    </body>
  </html>
  """

onServer = (app) ->
  app.post "/verify-attachment", (req, res) ->
    form = new multiparty.Form()

    form.parse req, (err, fields, files) ->
      fixturePath = path.resolve(e2ePath, "cypress", "fixtures", fields["foo"][0])
      filePath = files["bar"][0].path

      Promise.props({
        fixture: fs.readFileAsync(fixturePath),
        upload: fs.readFileAsync(filePath)
      })
      .then ({ fixture, upload }) ->
        ret = fixture.compare(upload)

        if ret is 0
          return res.send('files match')

        res.send(
          """
          file did not match. file at #{fixturePath} did not match #{filePath}.
          <br/>
          <hr/>
          buffer compare yielded: #{ret}
          """
        )

  ## all routes below this point will have bodies parsed
  app.use(bodyParser.text({
    type: '*/*' ## parse any content-type
  }))

  app.get "/", (req, res) ->
    res
    .type('html')
    .send(getFormHtml('action="/dump-body"'))

  app.get "/multipart-form-data", (req, res) ->
    res
    .type('html')
    .send(getFormHtml('action="/dump-body" enctype="multipart/form-data"'))

  app.get "/multipart-with-attachment", (req, res) ->
    res
    .type('html')
    .send(getFormHtml('action="/verify-attachment" enctype="multipart/form-data"', req.query.fixturePath))

  app.post "/dump-body", (req, res) ->
    res
    .type('html')
    .send(req.body)

describe "e2e forms", ->
  context "submissions with jquery XHR POST", ->
    e2e.setup()

    it "passing", ->
      e2e.exec(@, {
        spec: "form_submission_passing_spec.coffee"
        snapshot: true
        expectedExitCode: 0
      })

    it "failing", ->
      e2e.exec(@, {
        spec: "form_submission_failing_spec.coffee"
        snapshot: true
        expectedExitCode: 1
      })

  context "<form> submissions", ->
    e2e.setup({
      settings: {
        env: {
          PATH_TO_LARGE_IMAGE: pathToLargeImage
        }
      }
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

    before ->
      ## go out and fetch this image if we don't already have it
      fs
      .readFileAsync(pathToLargeImage)
      .catch { code: "ENOENT"}, ->
        ## 16MB image, too big to include with git repo
        rp("https://test-page-speed.cypress.io/files/huge-image.jpg")
        .then (resp) ->
          fs.outputFileAsync(pathToLargeImage, resp)

    it "passes with https on localhost", ->
      e2e.exec(@, {
        config: {
          baseUrl: "https://localhost:#{HTTPS_PORT}"
        }
        spec: "form_submission_multipart_spec.coffee"
        snapshot: true
        expectedExitCode: 0
      })

    it "passes with http on localhost", ->
      e2e.exec(@, {
        config: {
          baseUrl: "http://localhost:#{HTTP_PORT}"
        }
        spec: "form_submission_multipart_spec.coffee"
        snapshot: true
        expectedExitCode: 0
      })
