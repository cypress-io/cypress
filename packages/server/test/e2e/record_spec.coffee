_ = require("lodash")
Promise = require("bluebird")
bodyParser = require("body-parser")
jsonSchemas = require("@cypress/json-schemas").api
e2e = require("../support/helpers/e2e")

postRunResponse = jsonSchemas.getExample("postRunResponse")("2.0.0")
postRunInstanceResponse = jsonSchemas.getExample("postRunInstanceResponse")("2.0.0")

{ runId, groupId, machineId, runUrl } = postRunResponse
{ instanceId } = postRunInstanceResponse

requests = null

getRequestUrls = ->
  _.map(requests, "url")

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

sendResponse = (req, res, responseSchema) ->
  if _.isFunction(responseSchema)
    return responseSchema(req, res)

  res.json(getResponse(responseSchema))

ensureSchema = (requestSchema, responseSchema) ->
  if requestSchema
    [ name, version ] = requestSchema.split("@")

  return (req, res) ->
    { body } = req

    try
      if requestSchema
        jsonSchemas.assertSchema(name, version)(body)

      sendResponse(req, res, responseSchema)

      key = [req.method, req.url].join(" ")

      requests.push({
        url: key
        body
      })
    catch err
      res.status(412).json(getSchemaErr(err, requestSchema))

sendUploadUrls = (req, res) ->
  { body } = req

  num = 0

  json = {}

  if body.video
    json.videoUploadUrl = "http://localhost:1234/videos/video.mp4"

  screenshotUploadUrls = _.map body.screenshots, (s) ->
    num += 1

    return {
      screenshotId: s.screenshotId
      uploadUrl: "http://localhost:1234/screenshots/#{num}.png"
    }

  if screenshotUploadUrls.length
    json.screenshotUploadUrls = screenshotUploadUrls

  res.json(json)

onServer = (routes) ->
  return (app) ->
    app.use(bodyParser.json())

    _.each routes, (route) ->
      app[route.method](route.url, ensureSchema(
        route.req,
        route.res
      ))

setup = (routes, settings = {}) ->
  e2e.setup({
    settings: _.extend({
      projectId: "pid123"
      videoUploadOnPasses: false
    }, settings)
    servers: {
      port: 1234
      onServer: onServer(routes)
    }
  })

defaultRoutes = [
  {
    method: "post"
    url: "/runs"
    req: "postRunRequest@2.0.0",
    res: postRunResponse
  }, {
    method: "post"
    url: "/runs/:id/instances"
    req: "postRunInstanceRequest@2.0.0",
    res: postRunInstanceResponse
  }, {
    method: "put"
    url: "/instances/:id"
    req: "putInstanceRequest@2.0.0",
    res: sendUploadUrls
  }, {
    method: "put"
    url: "/instances/:id/stdout"
    req: "putInstanceStdoutRequest@1.0.0",
    res: (req, res) -> res.sendStatus(200)
  }, {
    method: "put"
    url: "/videos/:name"
    res: (req, res) ->
      Promise.delay(500)
      .then ->
        res.sendStatus(200)
  }, {
    method: "put"
    url: "/screenshots/:name"
    res: (req, res) -> res.sendStatus(200)
  }
]

describe "e2e record", ->
  beforeEach ->
    requests = []

  context "passing", ->
    setup(defaultRoutes)

    it "passes", ->
      e2e.exec(@, {
        key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
        spec: "record*"
        record: true
        snapshot: true
        expectedExitCode: 3
      })
      .get("stdout")
      .then (stdout) ->
        expect(stdout).to.include("Run URL:")
        expect(stdout).to.include(runUrl)

        urls = getRequestUrls()

        ## first create run request
        expect(urls[0]).to.eq("POST /runs")

        ## grab the first set of 4
        firstInstanceSet = urls.slice(1, 5)

        expect(firstInstanceSet).to.deep.eq([
          "POST /runs/#{runId}/instances"
          "PUT /instances/#{instanceId}"
          "PUT /videos/video.mp4"
          "PUT /instances/#{instanceId}/stdout"
        ])

        ## grab the second set of 5
        secondInstanceSet = urls.slice(5, 10)

        expect(secondInstanceSet).to.have.members([
          "POST /runs/#{runId}/instances"
          "PUT /instances/#{instanceId}"
          "PUT /videos/video.mp4"
          "PUT /screenshots/1.png"
          "PUT /instances/#{instanceId}/stdout"
        ])

        ## grab the third set of 5
        thirdInstanceSet = urls.slice(10, 14)

        ## no video because no tests failed
        expect(thirdInstanceSet).to.deep.eq([
          "POST /runs/#{runId}/instances"
          "PUT /instances/#{instanceId}"
          "PUT /screenshots/1.png"
          "PUT /instances/#{instanceId}/stdout"
        ])

        ## grab the forth set of 5
        forthInstanceSet = urls.slice(14, 19)

        expect(forthInstanceSet).to.have.members([
          "POST /runs/#{runId}/instances"
          "PUT /instances/#{instanceId}"
          "PUT /videos/video.mp4"
          "PUT /screenshots/1.png"
          "PUT /instances/#{instanceId}/stdout"
        ])

        postRun = requests[0]

        ## ensure its relative to projectRoot
        expect(postRun.body.specs).to.deep.eq([
          "cypress/integration/record_error_spec.coffee"
          "cypress/integration/record_fail_spec.coffee"
          "cypress/integration/record_pass_spec.coffee"
          "cypress/integration/record_uncaught_spec.coffee"
        ])
        expect(postRun.body.projectId).to.eq("pid123")
        expect(postRun.body.recordKey).to.eq("f858a2bc-b469-4e48-be67-0876339ee7e1")
        expect(postRun.body.specPattern).to.eq("cypress/integration/record*")

        firstInstance = requests[1]
        expect(firstInstance.body.groupId).to.eq(groupId)
        expect(firstInstance.body.machineId).to.eq(machineId)
        expect(firstInstance.body.spec).to.eq(
          "cypress/integration/record_error_spec.coffee"
        )

        firstInstancePut = requests[2]
        expect(firstInstancePut.body.error).to.include("Oops...we found an error preparing this test file")
        expect(firstInstancePut.body.tests).to.be.null
        expect(firstInstancePut.body.hooks).to.be.null
        expect(firstInstancePut.body.screenshots).to.have.length(0)
        expect(firstInstancePut.body.stats.tests).to.eq(0)
        expect(firstInstancePut.body.stats.failures).to.eq(1)
        expect(firstInstancePut.body.stats.passes).to.eq(0)

        firstInstanceStdout = requests[4]
        expect(firstInstanceStdout.body.stdout).to.include("record_error_spec.coffee")

        secondInstance = requests[5]
        expect(secondInstance.body.groupId).to.eq(groupId)
        expect(secondInstance.body.machineId).to.eq(machineId)
        expect(secondInstance.body.spec).to.eq(
          "cypress/integration/record_fail_spec.coffee"
        )

        secondInstancePut = requests[6]
        expect(secondInstancePut.body.error).to.be.null
        expect(secondInstancePut.body.tests).to.have.length(2)
        expect(secondInstancePut.body.hooks).to.have.length(1)
        expect(secondInstancePut.body.screenshots).to.have.length(1)
        expect(secondInstancePut.body.stats.tests).to.eq(2)
        expect(secondInstancePut.body.stats.failures).to.eq(1)
        expect(secondInstancePut.body.stats.passes).to.eq(0)
        expect(secondInstancePut.body.stats.skipped).to.eq(1)

        secondInstanceStdout = requests[9]
        expect(secondInstanceStdout.body.stdout).to.include("record_fail_spec.coffee")
        expect(secondInstanceStdout.body.stdout).not.to.include("record_error_spec.coffee")

        thirdInstance = requests[10]
        expect(thirdInstance.body.groupId).to.eq(groupId)
        expect(thirdInstance.body.machineId).to.eq(machineId)
        expect(thirdInstance.body.spec).to.eq(
          "cypress/integration/record_pass_spec.coffee"
        )

        thirdInstancePut = requests[11]
        expect(thirdInstancePut.body.error).to.be.null
        expect(thirdInstancePut.body.tests).to.have.length(2)
        expect(thirdInstancePut.body.hooks).to.have.length(0)
        expect(thirdInstancePut.body.screenshots).to.have.length(1)
        expect(thirdInstancePut.body.stats.tests).to.eq(2)
        expect(thirdInstancePut.body.stats.passes).to.eq(1)
        expect(thirdInstancePut.body.stats.failures).to.eq(0)
        expect(thirdInstancePut.body.stats.pending).to.eq(1)

        thirdInstanceStdout = requests[13]
        expect(thirdInstanceStdout.body.stdout).to.include("record_pass_spec.coffee")
        expect(thirdInstanceStdout.body.stdout).not.to.include("record_error_spec.coffee")
        expect(thirdInstanceStdout.body.stdout).not.to.include("record_fail_spec.coffee")

        fourthInstance = requests[14]
        expect(fourthInstance.body.groupId).to.eq(groupId)
        expect(fourthInstance.body.machineId).to.eq(machineId)
        expect(fourthInstance.body.spec).to.eq(
          "cypress/integration/record_uncaught_spec.coffee"
        )

        fourthInstancePut = requests[15]
        expect(fourthInstancePut.body.error).to.be.null
        expect(fourthInstancePut.body.tests).to.have.length(1)
        expect(fourthInstancePut.body.hooks).to.have.length(0)
        expect(fourthInstancePut.body.screenshots).to.have.length(1)
        expect(fourthInstancePut.body.stats.tests).to.eq(1)
        expect(fourthInstancePut.body.stats.failures).to.eq(1)
        expect(fourthInstancePut.body.stats.passes).to.eq(0)

        forthInstanceStdout = requests[18]
        expect(forthInstanceStdout.body.stdout).to.include("record_uncaught_spec.coffee")
        expect(forthInstanceStdout.body.stdout).not.to.include("record_error_spec.coffee")
        expect(forthInstanceStdout.body.stdout).not.to.include("record_fail_spec.coffee")
        expect(forthInstanceStdout.body.stdout).not.to.include("record_pass_spec.coffee")

  context "misconfiguration", ->
    setup([])

    it "errors and exits when no specs found", ->
      e2e.exec(@, {
        spec: "notfound/**"
        snapshot: true
        expectedExitCode: 1
      })
      .then ->
        expect(getRequestUrls()).to.be.empty

    it "errors and exits when no browser found", ->
      e2e.exec(@, {
        browser: "browserDoesNotExist"
        spec: "record_pass*"
        snapshot: true
        expectedExitCode: 1
      })
      .then ->
        expect(getRequestUrls()).to.be.empty

  context "projectId", ->
    e2e.setup()

    it "errors and exits without projectId", ->
      e2e.exec(@, {
        key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
        spec: "record_pass*"
        record: true
        snapshot: true
        expectedExitCode: 1
      })

  context "recordKey", ->
    setup(defaultRoutes)

    it "errors and exits without recordKey", ->
      e2e.exec(@, {
        spec: "record_pass*"
        record: true
        snapshot: true
        expectedExitCode: 1
      })
      .then ->
        expect(getRequestUrls()).to.be.empty

    it "warns but does not exit when is forked pr", ->
      process.env.CIRCLE_PR_NUMBER = "123"
      process.env.CIRCLE_PR_USERNAME = "brian-mann"
      process.env.CIRCLE_PR_REPONAME = "cypress"
      process.env.CYPRESS_INTERNAL_E2E_TESTS = "0"

      e2e.exec(@, {
        spec: "record_pass*"
        record: true
        snapshot: true
        expectedExitCode: 0
      })
      .then ->
        expect(getRequestUrls()).to.be.empty

  context "video recording", ->
    setup(defaultRoutes, {
      video: false
    })

    it "does not upload when not enabled", ->
      e2e.exec(@, {
        key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
        spec: "record_pass*"
        record: true
        snapshot: true
        expectedExitCode: 0
      })

  context "api interaction errors", ->
    describe "recordKey and projectId", ->
      routes = [
        {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.0.0",
          res: (req, res) -> res.sendStatus(401)
        }
      ]

      setup(routes)

      it "errors and exits on 401", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 1
        })

    describe "project 404", ->
      routes = [
        {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.0.0",
          res: (req, res) -> res.sendStatus(404)
        }
      ]

      setup(routes)

      it "errors and exits", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 1
        })

    describe "create run", ->
      routes = [{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.0.0",
        res: (req, res) -> res.sendStatus(500)
      }]

      setup(routes)

      it "warns and does not create or update instances", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 0
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
          ])

    describe "create instance", ->
      routes = [
        {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.0.0",
          res: postRunResponse
        }, {
          method: "post"
          url: "/runs/:id/instances"
          req: "postRunInstanceRequest@2.0.0",
          res: (req, res) -> res.sendStatus(500)
        }
      ]

      setup(routes)

      it "does not update instance", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 0
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
            "POST /runs/#{runId}/instances"
          ])

    describe "update instance", ->
      routes = [
        {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.0.0",
          res: postRunResponse
        }, {
          method: "post"
          url: "/runs/:id/instances"
          req: "postRunInstanceRequest@2.0.0",
          res: postRunInstanceResponse
        }, {
          method: "put"
          url: "/instances/:id"
          req: "putInstanceRequest@2.0.0",
          res: (req, res) -> res.sendStatus(500)
        }
      ]

      setup(routes)

      it "does not update instance stdout", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 0
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
            "POST /runs/#{runId}/instances"
            "PUT /instances/#{instanceId}"
          ])

    describe "update instance stdout", ->
      routes = [
        {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.0.0",
          res: postRunResponse
        }, {
          method: "post"
          url: "/runs/:id/instances"
          req: "postRunInstanceRequest@2.0.0",
          res: postRunInstanceResponse
        }, {
          method: "put"
          url: "/instances/:id"
          req: "putInstanceRequest@2.0.0",
          res: sendUploadUrls
        }, {
          method: "put"
          url: "/instances/:id/stdout"
          req: "putInstanceStdoutRequest@1.0.0",
          res: (req, res) -> res.sendStatus(500)
        }, {
          method: "put"
          url: "/videos/:name"
          res: (req, res) ->
            Promise.delay(500)
            .then ->
              res.sendStatus(200)
        }, {
          method: "put"
          url: "/screenshots/:name"
          res: (req, res) -> res.sendStatus(200)
        }
      ]

      setup(routes)

      it "warns but proceeds", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 0
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
            "POST /runs/#{runId}/instances"
            "PUT /instances/#{instanceId}"
            "PUT /screenshots/1.png"
            "PUT /instances/#{instanceId}/stdout"
          ])

    describe "uploading assets", ->
      routes = [
        {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.0.0",
          res: postRunResponse
        }, {
          method: "post"
          url: "/runs/:id/instances"
          req: "postRunInstanceRequest@2.0.0",
          res: postRunInstanceResponse
        }, {
          method: "put"
          url: "/instances/:id"
          req: "putInstanceRequest@2.0.0",
          res: sendUploadUrls
        }, {
          method: "put"
          url: "/instances/:id/stdout"
          req: "putInstanceStdoutRequest@1.0.0",
          res: (req, res) -> res.sendStatus(200)
        }, {
          method: "put"
          url: "/videos/:name"
          res: (req, res) ->
            Promise.delay(500)
            .then ->
              res.sendStatus(500)
        }, {
          method: "put"
          url: "/screenshots/:name"
          res: (req, res) -> res.sendStatus(500)
        }
      ]

      setup(routes, {
        videoUploadOnPasses: true
      })

      it "warns but proceeds", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 0
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.have.members([
            "POST /runs"
            "POST /runs/#{runId}/instances"
            "PUT /instances/#{instanceId}"
            "PUT /videos/video.mp4"
            "PUT /screenshots/1.png"
            "PUT /instances/#{instanceId}/stdout"
          ])
