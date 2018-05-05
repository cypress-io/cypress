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
  , {
    method: "put"
    url: "/instances/:id/stdout"
    req: "putInstanceStdoutRequest@1.0.0",
    res: (res) -> res.sendStatus(200)
  }
]

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

sendResponse = (res, responseSchema) ->
  if _.isFunction(responseSchema)
    return responseSchema(res)

  res.json(getResponse(responseSchema))

ensureSchema = (requestSchema, responseSchema) ->
  [ name, version ] = requestSchema.split("@")

  return (req, res) ->
    { body } = req

    try
      jsonSchemas.assertSchema(name, version)(body)
      sendResponse(res, responseSchema)

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

      postRun = requests[0]

      ## ensure its relative to projectRoot
      expect(postRun.body.specPattern).to.eq("cypress/integration/record*")

      firstInstance = requests[1]

      expect(firstInstance.body.spec).to.eq(
        "cypress/integration/record_fail_spec.coffee"
      )

      secondInstance = requests[4]

      expect(secondInstance.body.spec).to.eq(
        "cypress/integration/record_pass_spec.coffee"
      )
