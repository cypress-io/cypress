_ = require("lodash")
path = require("path")
Promise = require("bluebird")
bodyParser = require("body-parser")
jsonSchemas = require("@cypress/json-schemas").api
e2e = require("../support/helpers/e2e")
fs = require("../../lib/util/fs")
Fixtures = require("../support/helpers/fixtures")

postRunResponseWithWarnings = jsonSchemas.getExample("postRunResponse")("2.1.0")
postRunResponse = _.assign({}, postRunResponseWithWarnings, { warnings: [] })
postRunInstanceResponse = jsonSchemas.getExample("postRunInstanceResponse")("2.1.0")

e2ePath = Fixtures.projectPath("e2e")
outputPath = path.join(e2ePath, "output.json")

{ runId, groupId, machineId, runUrl } = postRunResponse
{ instanceId } = postRunInstanceResponse

requests = null

getRequestUrls = ->
  _.map(requests, "url")

getSchemaErr = (tag, err, schema) ->
  {
    errors: err.errors
    object: err.object
    example: err.example
    message: "#{tag} should follow #{schema} schema"
  }

getResponse = (responseSchema) ->
  if _.isObject(responseSchema)
    return responseSchema

  [ name, version ] = responseSchema.split("@")

  jsonSchemas.getExample(name)(version)

sendResponse = (req, res, responseBody) ->
  if _.isFunction(responseBody)
    return responseBody(req, res)

  res.json(getResponse(responseBody))

ensureSchema = (expectedRequestSchema, responseBody, expectedResponseSchema) ->
  if expectedRequestSchema
    [ reqName, reqVersion ] = expectedRequestSchema.split("@")

  return (req, res) ->
    { body } = req

    try
      if expectedRequestSchema
        jsonSchemas.assertSchema(reqName, reqVersion)(body)

      res.expectedResponseSchema = expectedResponseSchema

      sendResponse(req, res, responseBody)

      key = [req.method, req.url].join(" ")

      requests.push({
        url: key
        body
      })
    catch err
      res.status(412).json(getSchemaErr("request", err, expectedRequestSchema))

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

  json.screenshotUploadUrls = screenshotUploadUrls

  res.json(json)

assertResponseBodySchema = (req, res, next) ->
  oldWrite = res.write
  oldEnd = res.end

  chunks = []

  res.write = (chunk) ->
    ## buffer the response, we'll really write it on end
    chunks.push(chunk)

  res.end = (chunk) ->
    if (chunk)
      chunks.push(chunk)

    res.write = oldWrite
    res.end = oldEnd

    if res.expectedResponseSchema && _.inRange(res.statusCode, 200, 299)
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'))

      [ resName, resVersion ] = res.expectedResponseSchema.split("@")

      try
        jsonSchemas.assertSchema(resName, resVersion)(body)
      catch err
        return res.status(412).json(getSchemaErr("response", err, res.expectedResponseSchema))

    chunks.map (chunk) ->
      res.write(chunk)
    res.end()

  next()

onServer = (routes) ->
  return (app) ->
    app.use(bodyParser.json())

    app.use(assertResponseBodySchema)

    _.each routes, (route) ->
      app[route.method](route.url, ensureSchema(
        route.req,
        route.res,
        route.resSchema
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
    req: "postRunRequest@2.1.0",
    resSchema: "postRunResponse@2.1.0"
    res: postRunResponse
  }, {
    method: "post"
    url: "/runs/:id/instances"
    req: "postRunInstanceRequest@2.1.0",
    resSchema: "postRunInstanceResponse@2.1.0"
    res: postRunInstanceResponse
  }, {
    method: "put"
    url: "/instances/:id"
    req: "putInstanceRequest@2.0.0",
    resSchema: "putInstanceResponse@2.0.0"
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
        outputPath: outputPath
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

        fs.readJsonAsync(outputPath)
        .then (results) ->
          expect(results.runUrl).to.equal(runUrl)

  context "parallelization", ->
    allSpecs = [
      "cypress/integration/record_error_spec.coffee",
      "cypress/integration/record_fail_spec.coffee",
      "cypress/integration/record_pass_spec.coffee",
      "cypress/integration/record_uncaught_spec.coffee",
    ]

    postInstanceResponses = (specs) ->
      return _
      .chain(specs)
      .map (spec, i) ->
        return {
          spec
          instanceId
          estimatedWallClockDuration: (i + 1) * 1000
        }
      .concat({
        spec: null
        instanceId: null,
        estimatedWallClockDuration: null
      })
      .value()

    ## a1 does 3 specs, b2 does 1 spec
    a1Specs = _.without(allSpecs, "cypress/integration/record_pass_spec.coffee")
    b2Specs = _.difference(allSpecs, a1Specs)

    firstRunResponse = false
    waitUntilSecondInstanceClaims = null

    claimed = []

    responses = {
      a1: postInstanceResponses(a1Specs)
      b2: postInstanceResponses(b2Specs)
    }

    ## replace the 1st + 2nd routes object
    routes = defaultRoutes.slice(0)
    routes[0] = {
      method: "post"
      url: "/runs"
      req: "postRunRequest@2.1.0",
      resSchema: "postRunResponse@2.1.0"
      res: (req, res) ->
        { group, ciBuildId } = req.body

        expect(group).to.eq("prod-e2e")
        expect(ciBuildId).to.eq("ciBuildId123")

        ## if this is the first response
        ## give machineId a1, else b2
        if not firstRunResponse
          firstRunResponse = true
          machineId = "a1ad2bcf-6398-46ed-b201-2fd90b188d5f"
        else
          machineId = "b2bd2bcf-6398-46ed-b201-2fd90b188d5f"

        res.json(
          _.extend({}, postRunResponse, { machineId })
        )

    }
    routes[1] = {
      method: "post"
      url: "/runs/:id/instances"
      req: "postRunInstanceRequest@2.1.0",
      resSchema: "postRunInstanceResponse@2.1.0"
      res: (req, res) ->
        { machineId, spec } = req.body

        expect(spec).to.be.null

        mId = machineId.slice(0, 2)

        respond = ->
          resp = responses[mId].shift()

          ## if theres a spec to claim
          if resp.spec
            claimed.push(resp)

          resp.claimedInstances = claimed.length
          resp.totalInstances = allSpecs.length

          jsonSchemas.assertSchema("postRunInstanceResponse", "2.1.0")(resp)
          res.json(resp)

        ## when the 1st machine attempts to claim its FIRST spec, we
        ## automatically delay it until the 2nd machine claims its FIRST
        ## spec so that the request URL's are deterministic
        if mId is "a1" and claimed.length is 0
          waitUntilSecondInstanceClaims = ->
            waitUntilSecondInstanceClaims = null
            respond()
        else
          respond()
          waitUntilSecondInstanceClaims?()
    }

    setup(routes)

    it "passes in parallel with group", ->
      Promise.all([
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record*"
          group: "prod-e2e"
          record: true
          parallel: true
          snapshot: true
          ciBuildId: "ciBuildId123"
          expectedExitCode: 3
          config: {
            trashAssetsBeforeRuns: false
          }
        })
        .get("stdout"),

        ## stagger the 2nd instance
        ## starting up a bit
        Promise
        .delay(3000)
        .then =>
          e2e.exec(@, {
            key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
            spec: "record*"
            group: "prod-e2e"
            record: true
            parallel: true
            snapshot: true
            ciBuildId: "ciBuildId123"
            expectedExitCode: 0
            config: {
              trashAssetsBeforeRuns: false
            }
          })
          .get("stdout")
    ])

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
      process.env.CIRCLECI = "true"
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

    it "warns but does not exit when is forked pr and parallel", ->
      process.env.CIRCLECI = "true"
      process.env.CIRCLE_WORKFLOW_ID = "123"
      process.env.CIRCLE_PR_NUMBER = "123"
      process.env.CIRCLE_PR_USERNAME = "brian-mann"
      process.env.CIRCLE_PR_REPONAME = "cypress"
      process.env.CYPRESS_INTERNAL_E2E_TESTS = "0"

      e2e.exec(@, {
        spec: "record_pass*"
        record: true
        parallel: true
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
          req: "postRunRequest@2.1.0",
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
          req: "postRunRequest@2.1.0",
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

    describe "create run 500", ->
      routes = [{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) -> res.sendStatus(500)
      }]

      setup(routes)

      it "warns and does not create or update instances", ->
        process.env.DISABLE_API_RETRIES = "true"

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

      it "warns but proceeds when grouping without parallelization", ->
        process.env.DISABLE_API_RETRIES = "true"

        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          group: "foo"
          record: true
          snapshot: true
          ciBuildId: "ciBuildId123"
          expectedExitCode: 0
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
          ])

      it "does not proceed and exits with error when parallelizing", ->
        process.env.DISABLE_API_RETRIES = "true"

        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          group: "foo"
          record: true
          parallel: true
          snapshot: true
          ciBuildId: "ciBuildId123"
          expectedExitCode: 1
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
          ])

    describe "create instance 500", ->
      routes = defaultRoutes.slice(0)

      routes[1] = {
        method: "post"
        url: "/runs/:id/instances"
        req: "postRunInstanceRequest@2.1.0",
        resSchema: "postRunInstanceResponse@2.1.0"
        res: (req, res) -> res.sendStatus(500)
      }

      setup(routes)

      it "does not proceed and exits with error when parallelizing and creating instance", ->
        process.env.DISABLE_API_RETRIES = "true"

        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          group: "foo"
          record: true
          parallel: true
          snapshot: true
          ciBuildId: "ciBuildId123"
          expectedExitCode: 1
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs",
            "POST /runs/#{runId}/instances"
          ])

    describe "update instance 500", ->
      routes = defaultRoutes.slice(0)

      routes[1] = {
        method: "post"
        url: "/runs/:id/instances"
        req: "postRunInstanceRequest@2.1.0",
        resSchema: "postRunInstanceResponse@2.1.0"
        res: (req, res) ->
          res.json({
            instanceId
            spec: "cypress/integration/record_pass_spec.coffee"
            estimatedWallClockDuration: 5000
            totalInstances: 1
            claimedInstances: 1
          })
      }

      routes[2] = {
        method: "put"
        url: "/instances/:id"
        req: "putInstanceRequest@2.0.0",
        res: (req, res) -> res.sendStatus(500)
      }

      setup(routes)

      it "does not proceed and exits with error when parallelizing and updating instance", ->
        process.env.DISABLE_API_RETRIES = "true"

        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          group: "foo"
          record: true
          parallel: true
          snapshot: true
          ciBuildId: "ciBuildId123"
          expectedExitCode: 1
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs",
            "POST /runs/#{runId}/instances"
            "PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6"
          ])

    describe "create run 422", ->
      routes = [{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) -> res.status(422).json({
          code: "RUN_GROUP_NAME_NOT_UNIQUE"
          message: "Run group name cannot be used again without passing the parallel flag."
          payload: {
            runUrl: "https://dashboard.cypress.io/runs/12345"
          }
        })
      }]

      setup(routes)

      ## the other 422 tests for this are in integration/cypress_spec
      it "errors and exits when group name is in use", ->
        process.env.CIRCLECI = "1"

        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          group: "e2e-tests"
          record: true
          snapshot: true
          expectedExitCode: 1
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
          ])

    describe "create run unknown 422", ->
      routes = [{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) -> res.status(422).json({
          code: "SOMETHING_UNKNOWN"
          message: "An unknown message here from the server."
        })
      }]

      setup(routes)

      it "errors and exits when there is an unknown 422 response", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          group: "e2e-tests"
          record: true
          parallel: true
          snapshot: true
          ciBuildId: "ciBuildId123"
          expectedExitCode: 1
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
          ])

    describe "create run 402 - free plan exceeds monthly private tests", ->
      setup([{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) -> res.status(402).json({
          code: "FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS"
          payload: {
            used: 600
            limit: 500
            orgId: "org-id-1234"
          }
        })
      }])

      it "errors and exits when on free plan and over recorded runs limit", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 1
        })

    describe "create run 402 - free plan exceeds monthly tests", ->
      setup([{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) -> res.status(402).json({
          code: "FREE_PLAN_EXCEEDS_MONTHLY_TESTS"
          payload: {
            used: 600
            limit: 500
            orgId: "org-id-1234"
          }
        })
      }])

      it "errors and exits when on free plan and over recorded tests limit", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 1
        })

    describe "create run 402 - parallel feature not available in plan", ->
      setup([{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) -> res.status(402).json({
          code: "PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN"
          payload: {
            orgId: "org-id-1234"
          }
        })
      }])

      it "errors and exits when attempting parallel run when not available in plan", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 1
        })

    describe "create run 402 - grouping feature not available in plan", ->
      setup([{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) -> res.status(402).json({
          code: "RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN"
          payload: {
            orgId: "org-id-1234"
          }
        })
      }])

      it "errors and exits when attempting parallel run when not available in plan", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 1
        })

    describe "create run 402 - unknown error", ->
      setup([{
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) -> res.status(402).json({
          error: "Something went wrong"
        })
      }])

      it "errors and exits when there's an unknown 402 error", ->
        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          record: true
          snapshot: true
          expectedExitCode: 1
        })

    describe "create instance", ->
      routes = [
        {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: postRunResponse
        }, {
          method: "post"
          url: "/runs/:id/instances"
          req: "postRunInstanceRequest@2.1.0",
          resSchema: "postRunInstanceResponse@2.1.0"
          res: (req, res) -> res.sendStatus(500)
        }
      ]

      setup(routes)

      it "does not update instance", ->
        process.env.DISABLE_API_RETRIES = "true"

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
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: postRunResponse
        }, {
          method: "post"
          url: "/runs/:id/instances"
          req: "postRunInstanceRequest@2.1.0",
          resSchema: "postRunInstanceResponse@2.1.0"
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
        process.env.DISABLE_API_RETRIES = "true"

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
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: postRunResponse
        }, {
          method: "post"
          url: "/runs/:id/instances"
          req: "postRunInstanceRequest@2.1.0",
          resSchema: "postRunInstanceResponse@2.1.0"
          res: postRunInstanceResponse
        }, {
          method: "put"
          url: "/instances/:id"
          req: "putInstanceRequest@2.0.0",
          resSchema: "putInstanceResponse@2.0.0"
          res: sendUploadUrls
        }, {
          method: "put"
          url: "/instances/:id/stdout"
          req: "putInstanceStdoutRequest@1.0.0",
          resSchema: "putInstanceStdoutRequest@1.0.0"
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
        process.env.DISABLE_API_RETRIES = "true"

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
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: postRunResponse
        }, {
          method: "post"
          url: "/runs/:id/instances"
          req: "postRunInstanceRequest@2.1.0",
          resSchema: "postRunInstanceResponse@2.1.0"
          res: postRunInstanceResponse
        }, {
          method: "put"
          url: "/instances/:id"
          req: "putInstanceRequest@2.0.0",
          resSchema: "putInstanceResponse@2.0.0"
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

    describe "api retries on error", ->
      count = 0

      routes = defaultRoutes.slice(0)

      routes[0] = {
        method: "post"
        url: "/runs"
        req: "postRunRequest@2.1.0",
        res: (req, res) ->
          count += 1

          if count is 4
            res.json(postRunResponse)
          else
            res.sendStatus(500)
      }

      routes[1] = {
        method: "post"
        url: "/runs/:id/instances"
        req: "postRunInstanceRequest@2.1.0",
        resSchema: "postRunInstanceResponse@2.1.0"
        res: (req, res) ->
          count += 1

          if count is 5
            return res.sendStatus(500)

          if count is 6
            res.json({
              instanceId
              spec: "cypress/integration/record_pass_spec.coffee"
              estimatedWallClockDuration: 5000
              totalInstances: 1
              claimedInstances: 1
            })
          else
            res.json({
              instanceId,
              spec: null
              estimatedWallClockDuration: null
              totalInstances: 0
              claimedInstances: 0
            })
      }

      setup(routes)

      it "warns and does not create or update instances", ->
        process.env.API_RETRY_INTERVALS = "1000,2000,3000"

        e2e.exec(@, {
          key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
          spec: "record_pass*"
          group: "foo"
          record: true
          parallel: true
          snapshot: true
          ciBuildId: "ciBuildId123"
          expectedExitCode: 0
        })
        .then ->
          urls = getRequestUrls()

          expect(urls).to.deep.eq([
            "POST /runs"
            "POST /runs"
            "POST /runs"
            "POST /runs"
            "POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances"
            "POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances"
            "PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6"
            "PUT /screenshots/1.png"
            "PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/stdout"
            "POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances"
          ])

  describe "api interaction warnings", ->

    describe "create run warnings", ->
      describe "grace period - over private tests limit", ->
        routes = defaultRoutes.slice()
        routes[0] = {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: (req, res) -> res.status(200).json({
            runId
            groupId
            machineId
            runUrl
            warnings: [{
              name: "foo"
              message: "foo"
              code: "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS"
              limit: 500
              gracePeriodEnds: "2999-12-31"
              orgId: "org-id-1234"
            }]
          })
        }

        setup(routes)

        it "warns when over private test recordings", ->
          e2e.exec(@, {
            key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
            spec: "record_pass*"
            record: true
            snapshot: true
            expectedExitCode: 0
          })

      describe "grace period - over tests limit", ->
        routes = defaultRoutes.slice()
        routes[0] = {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: (req, res) -> res.status(200).json({
            runId
            groupId
            machineId
            runUrl
            warnings: [{
              name: "foo"
              message: "foo"
              code: "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS"
              limit: 500
              gracePeriodEnds: "2999-12-31"
              orgId: "org-id-1234"
            }]
          })
        }

        setup(routes)

        it "warns when over test recordings", ->
          e2e.exec(@, {
            key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
            spec: "record_pass*"
            record: true
            snapshot: true
            expectedExitCode: 0
          })

      describe "grace period - parallel feature", ->
        routes = defaultRoutes.slice()
        routes[0] = {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: (req, res) -> res.status(200).json({
            runId
            groupId
            machineId
            runUrl
            warnings: [{
              name: "foo"
              message: "foo"
              code: "FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE"
              gracePeriodEnds: "2999-12-31"
              orgId: "org-id-1234"
            }]
          })
        }

        setup(routes)

        it "warns when using parallel feature", ->
          e2e.exec(@, {
            key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
            spec: "record_pass*"
            record: true
            snapshot: true
            expectedExitCode: 0
          })

      describe "grace period - grouping feature", ->
        routes = defaultRoutes.slice()
        routes[0] = {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: (req, res) -> res.status(200).json({
            runId
            groupId
            machineId
            runUrl
            warnings: [{
              name: "foo"
              message: "foo"
              code: "PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED"
              gracePeriodEnds: "2999-12-31"
              orgId: "org-id-1234"
            }]
          })
        }

        setup(routes)

        it "warns when using parallel feature", ->
          e2e.exec(@, {
            key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
            spec: "record_pass*"
            record: true
            snapshot: true
            expectedExitCode: 0
          })

      describe "paid plan - over private tests limit", ->
        routes = defaultRoutes.slice()
        routes[0] = {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: (req, res) -> res.status(200).json({
            runId
            groupId
            machineId
            runUrl
            warnings: [{
              name: "foo"
              message: "foo"
              code: "PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS"
              used: 700
              limit: 500
              orgId: "org-id-1234"
            }]
          })
        }

        setup(routes)

        it "warns when over private test recordings", ->
          e2e.exec(@, {
            key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
            spec: "record_pass*"
            record: true
            snapshot: true
            expectedExitCode: 0
          })

      describe "paid plan - over tests limit", ->
        routes = defaultRoutes.slice()
        routes[0] = {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: (req, res) -> res.status(200).json({
            runId
            groupId
            machineId
            runUrl
            warnings: [{
              name: "foo"
              message: "foo"
              code: "PAID_PLAN_EXCEEDS_MONTHLY_TESTS"
              used: 700
              limit: 500
              orgId: "org-id-1234"
            }]
          })
        }

        setup(routes)

        it "warns when over test recordings", ->
          e2e.exec(@, {
            key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
            spec: "record_pass*"
            record: true
            snapshot: true
            expectedExitCode: 0
          })

      describe "unknown warning", ->
        routes = defaultRoutes.slice()
        routes[0] = {
          method: "post"
          url: "/runs"
          req: "postRunRequest@2.1.0",
          resSchema: "postRunResponse@2.1.0"
          res: postRunResponseWithWarnings
        }

        setup(routes)

        it "warns with unknown warning code", ->
          e2e.exec(@, {
            key: "f858a2bc-b469-4e48-be67-0876339ee7e1"
            spec: "record_pass*"
            record: true
            snapshot: true
            expectedExitCode: 0
          })

