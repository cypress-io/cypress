bodyParser = require("body-parser")
e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.use(bodyParser.json())

  app.get "/response", (req, res) ->
    res.json({ ok: true })

expectedFailures = 48

verifyPassedAndFailedAreSame = ({ code, stdout }) ->
  passes = stdout.match(/✓ ✓ VERIFY/g)
  expect(code).to.equal(expectedFailures)
  expect(passes.length).to.equal(expectedFailures)

describe "e2e reporters", ->
  e2e.setup({
    port: 1919
    onServer
  })

  it "displays correct UI for errors", ->
    e2e.exec(@, {
      spec: "various_failures_spec.js"
      expectedExitCode: expectedFailures
    })
    .then(verifyPassedAndFailedAreSame)

  it "displays correct UI for errors in custom commands", ->
    e2e.exec(@, {
      spec: "various_failures_custom_commands_spec.js"
      expectedExitCode: expectedFailures
    })
    .then(verifyPassedAndFailedAreSame)
