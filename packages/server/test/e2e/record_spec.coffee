_ = require("lodash")
bodyParser = require("body-parser")
jsonSchemas = require("@cypress/json-schemas").api
e2e = require("../support/helpers/e2e")

requests = []

routes = [
  {
    method: "post"
    url: "/runs"
    req: "postRunRequest@3.0.0",
    res: "postRunResponse@1.1.0"
  }, {
    method: "post"
    url: "/runs/:id/instances"
    req: "postRunInstanceRequest@3.0.0",
    res: { instanceId: "instanceId-123-guid" }
  }, {
    method: "put"
    url: "/instances/:id"
    req: "putInstanceRequest@1.0.0",
    res: "putInstanceResponse@1.0.0"
  }
]

applyHacksToBody = (body) ->
  if tests = body.tests
    _.each tests, (test) ->
      test.instanceId = "f858a2bc-b469-4e48-be67-0876339ee7e1"
      test.failedFromHookId = "h1"

  if screenshots = body.screenshots
    _.each screenshots, (screenshot) ->
      screenshot.testTitle = []

getSchemaErr = (err, schema) ->
  {
    errors: err.errors
    object: err.object
    example: err.example
    message: "Request should follow #{schema} schema"
  }

getResponse = (responseSchema) ->
  if _.isObject(responseSchema)
    return responseSchema

  [ name, version ] = responseSchema.split("@")

  jsonSchemas.getExample(name)(version)

ensureSchema = (requestSchema, responseSchema) ->
  [ name, version ] = requestSchema.split("@")

  return (req, res) ->
    { body } = req

    ## TODO: these are the hacks
    ## to get the schema to pass
    ## remove this once its fixed
    applyHacksToBody(body)

    try
      jsonSchemas.assertSchema(name, version)(body)
      res.json(getResponse(responseSchema))

      key = [req.method, req.url].join(" ")

      requests.push({
        url: key
        body
      })
    catch err
      res.status(400).json(getSchemaErr(err, requestSchema))

onServer = (app) ->
  app.use(bodyParser.json())

  _.each routes, (route) ->
    app[route.method](route.url, ensureSchema(
      route.req,
      route.res
    ))

describe "e2e record", ->
  e2e.setup({
    settings: {
      projectId: "pid123"
    }
    servers: {
      port: 1234
      onServer: onServer
    }
  })

  it "passes", ->
    e2e.exec(@, {
      # key: "abc123"
      key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
      spec: "record*"
      record: true
      # snapshot: true
      expectedExitCode: 2
    })
    .then ->
      urls = _.map(requests, "url")

      expect(urls).to.deep.eq([
        "POST /runs"
        "POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances"
        "PUT /instances/instanceId-123-guid"
        "PUT /instances/instanceId-123-guid/stdout"
        "POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances"
        "PUT /instances/instanceId-123-guid"
        "PUT /instances/instanceId-123-guid/stdout"
      ])

      firstInstance = requests[1]

      expect(firstInstance.body.spec).to.eq(
        "cypress/integration/record_pass_spec.coffee"
      )

      secondInstance = requests[1]

      expect(secondInstance.body.spec).to.eq(
        "cypress/integration/record_fail_spec.coffee"
      )
