require("../spec_helper")

_        = require("lodash")
rp       = require("request-promise")
os       = require("os")
pkg      = require("#{root}package.json")
api      = require("#{root}lib/api")
Promise  = require("bluebird")
provider = require("#{root}lib/util/provider")

describe "lib/api", ->
  beforeEach ->
    @sandbox.stub(os, "platform").returns("linux")
    @sandbox.stub(provider, "get").returns("circle")

  context ".getOrgs", ->
    it "GET /orgs + returns orgs", ->
      orgs = []

      nock("http://localhost:1234")
      .matchHeader("x-session", "session-123")
      .get("/organizations")
      .reply(200, orgs)

      api.getOrgs("session-123")
      .then (ret) ->
        expect(ret).to.eql(orgs)

  context ".getProjects", ->
    it "GET /projects + returns projects", ->
      projects = []

      nock("http://localhost:1234")
      .matchHeader("x-session", "session-123")
      .get("/projects")
      .reply(200, projects)

      api.getProjects("session-123")
      .then (ret) ->
        expect(ret).to.eql(projects)

  context ".getProject", ->
    it "GET /projects/:id + returns project", ->
      project = { id: "id-123" }

      nock("http://localhost:1234")
      .matchHeader("x-session", "session-123")
      .matchHeader("x-route-version", "2")
      .get("/projects/id-123")
      .reply(200, project)

      api.getProject("id-123", "session-123")
      .then (ret) ->
        expect(ret).to.eql(project)

  context ".getProjectBuilds", ->
    it "GET /projects/:id/builds + returns builds", ->
      builds = []

      nock("http://localhost:1234")
      .matchHeader("x-session", "session-123")
      .get("/projects/id-123/builds")
      .reply(200, builds)

      api.getProjectBuilds("id-123", "session-123")
      .then (ret) ->
        expect(ret).to.eql(builds)

  context ".ping", ->
    it "GET /ping", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .get("/ping")
      .reply(200, "OK")

      api.ping()
      .then (resp) ->
        expect(resp).to.eq("OK")

  context ".createBuild", ->
    it "POST /builds + returns buildId", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "2")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds", {
        projectId:         "id-123"
        projectToken:      "token-123"
        commitSha:         "sha"
        commitBranch:      "master"
        commitAuthorName:  "brian"
        commitAuthorEmail: "brian@cypress.io"
        commitMessage:     "such hax"
        ciProvider:        "circle"
      })
      .reply(200, {
        buildId: "new-build-id-123"
      })

      api.createBuild({
        projectId:         "id-123"
        projectToken:      "token-123"
        commitSha:         "sha"
        commitBranch:      "master"
        commitAuthorName:  "brian"
        commitAuthorEmail: "brian@cypress.io"
        commitMessage:     "such hax"
      })
      .then (ret) ->
        expect(ret).to.eq("new-build-id-123")

    it "POST /builds failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "2")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds", {
        projectId:         null
        projectToken:      "token-123"
        commitSha:         "sha"
        commitBranch:      "master"
        commitAuthorName:  "brian"
        commitAuthorEmail: "brian@cypress.io"
        commitMessage:     "such hax"
        ciProvider:        "circle"
      })
      .reply(422, {
        errors: {
          buildId: ["is required"]
        }
      })

      api.createBuild({
        projectId:         null
        projectToken:      "token-123"
        commitSha:         "sha"
        commitBranch:      "master"
        commitAuthorName:  "brian"
        commitAuthorEmail: "brian@cypress.io"
        commitMessage:     "such hax"
      })
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("""
          422

          {
            "errors": {
              "buildId": [
                "is required"
              ]
            }
          }
        """)

    it "handles timeouts", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "2")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds")
      .socketDelay(5000)
      .reply(200, {})

      api.createBuild({
        timeout: 100
      })
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("Error: ESOCKETTIMEDOUT")

    it "sets timeout to 10 seconds", ->
      @sandbox.stub(rp, "post").returns({
        promise: ->
          get: ->
            catch: ->
              then: (fn) -> fn()
      })

      api.createBuild({})
      .then ->
        expect(rp.post).to.be.calledWithMatch({timeout: 10000})

  context ".createInstance", ->
    beforeEach ->
      Object.defineProperty(process.versions, "chrome", {
        value: "53"
      })

    it "POSTs /builds/:id/instances", ->
      @sandbox.stub(os, "release").returns("10.10.10")
      os.platform.returns("darwin")

      nock("http://localhost:1234")
      .matchHeader("x-route-version", "3")
      .matchHeader("x-platform", "darwin")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds/build-id-123/instances", {
        spec: "cypress/integration/app_spec.js"
        browserName: "Electron"
        browserVersion: "53"
        osName: "darwin"
        osVersion: "10.10.10"
      })
      .reply(200, {
        instanceId: "instance-id-123"
      })

      api.createInstance({
        buildId: "build-id-123"
        spec: "cypress/integration/app_spec.js"
      })
      .then (instanceId) ->
        expect(instanceId).to.eq("instance-id-123")

    it "POST /builds/:id/instances failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "3")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds/build-id-123/instances")
      .reply(422, {
        errors: {
          tests: ["is required"]
        }
      })

      api.createInstance({buildId: "build-id-123"})
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("""
          422

          {
            "errors": {
              "tests": [
                "is required"
              ]
            }
          }
        """)

    it "handles timeouts", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "3")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds/build-id-123/instances")
      .socketDelay(5000)
      .reply(200, {})

      api.createInstance({
        buildId: "build-id-123"
        timeout: 100
      })
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("Error: ESOCKETTIMEDOUT")

    it "sets timeout to 10 seconds", ->
      @sandbox.stub(rp, "post").returns({
        promise: ->
          get: ->
            catch: ->
              then: (fn) -> fn()
      })

      api.createInstance({})
      .then ->
        expect(rp.post).to.be.calledWithMatch({timeout: 10000})

  context ".updateInstance", ->
    beforeEach ->
      Object.defineProperty(process.versions, "chrome", {
        value: "53"
      })

    it "PUTs /builds/:id/instances", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123", {
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        error: "err msg"
        video: true
        screenshots: []
        failingTests: []
        cypressConfig: {}
        ciProvider: "circle"
      })
      .reply(200)

      api.updateInstance({
        instanceId: "instance-id-123"
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        error: "err msg"
        video: true
        screenshots: []
        failingTests: []
        cypressConfig: {}
      })

    it "PUT /builds/:id/instances failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123")
      .reply(422, {
        errors: {
          tests: ["is required"]
        }
      })

      api.updateInstance({instanceId: "instance-id-123"})
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("""
          422

          {
            "errors": {
              "tests": [
                "is required"
              ]
            }
          }
        """)

    it "handles timeouts", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123")
      .socketDelay(5000)
      .reply(200, {})

      api.updateInstance({
        instanceId: "instance-id-123"
        timeout: 100
      })
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("Error: ESOCKETTIMEDOUT")

    it "sets timeout to 10 seconds", ->
      @sandbox.stub(rp, "put").resolves()

      api.updateInstance({})
      .then ->
        expect(rp.put).to.be.calledWithMatch({timeout: 10000})

  context ".getLoginUrl", ->
    it "GET /auth + returns the url", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .get("/auth")
      .reply(200, {
        url: "https://github.com/authorize"
      })

      api.getLoginUrl().then (url) ->
        expect(url).to.eq("https://github.com/authorize")

  context ".createSignin", ->
    it "POSTs /signin + returns user object", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "2")
      .post("/signin")
      .query({code: "abc-123"})
      .reply(200, {
        name: "brian"
      })

      api.createSignin("abc-123").then (user) ->
        expect(user).to.deep.eq({
          name: "brian"
        })

    it "handles 401 exceptions", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "2")
      .post("/signin")
      .query({code: "abc-123"})
      .reply(401, "Your email: 'brian@gmail.com' has not been authorized.")

      api.createSignin("abc-123")
      .then ->
        throw new Error("should have thrown error")
      .catch (err) ->
        expect(err.message).to.eq("Your email: 'brian@gmail.com' has not been authorized.")

  context ".createSignout", ->
    it "POSTs /signout", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-session", "abc-123")
      .post("/signout")
      .reply(200)

      api.createSignout("abc-123")

  context ".createProject", ->
    it "POSTs /projects", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-session", "session-123")
      .matchHeader("x-route-version", "2")
      .post("/projects", {
        name: "foobar"
        orgId: "org-id-123"
        public: true
      })
      .reply(200, {
        id: "id-123"
        name: "foobar"
        orgId: "org-id-123"
        public: true
      })

      projectDetails = {
        projectName: "foobar"
        orgId: "org-id-123"
        public: true
      }
      api.createProject(projectDetails, "session-123").then (projectDetails) ->
        expect(projectDetails).to.eql({
          id: "id-123"
          name: "foobar"
          orgId: "org-id-123"
          public: true
        })

  context ".getProjectCiKeys", ->
    it "GET /projects/:id/keys + returns keys", ->
      ciKeys = []

      nock("http://localhost:1234")
      .matchHeader("x-session", "session-123")
      .get("/projects/id-123/keys")
      .reply(200, ciKeys)

      api.getProjectCiKeys("id-123", "session-123")
      .then (ret) ->
        expect(ret).to.eql(ciKeys)

  context ".sendUsage", ->
    it "POSTs /user/usage", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-session", "session-123")
      .post("/user/usage", {
        "x-runs": 5
        "x-example": true
        "x-all": false
        "x-project-name": "admin"
      })
      .reply(200)

      api.sendUsage(5, true, false, "admin", "session-123")

  context ".getProjectToken", ->
    it "GETs /projects/:id/token", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-session", "session-123")
      .get("/projects/project-123/token")
      .reply(200, {
        apiToken: "token-123"
      })

      api.getProjectToken("project-123", "session-123")
      .then (resp) ->
        expect(resp).to.eq("token-123")

  context ".updateProjectToken", ->
    it "PUTs /projects/:id/token", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-session", "session-123")
      .put("/projects/project-123/token")
      .reply(200, {
        apiToken: "token-123"
      })

      api.updateProjectToken("project-123", "session-123")
      .then (resp) ->
        expect(resp).to.eq("token-123")

  context ".createRaygunException", ->
    beforeEach ->
      @setup = (body, session, delay = 0) ->
        nock("http://localhost:1234")
        .matchHeader("x-platform", "linux")
        .matchHeader("x-cypress-version", pkg.version)
        .matchHeader("x-session", session)
        .post("/exceptions", body)
        .delayConnection(delay)
        .reply(200)

    it "POSTs /exceptions", ->
      @setup({foo: "bar"}, "abc-123")
      api.createRaygunException({foo: "bar"}, "abc-123")

    it "by default times outs after 3 seconds", ->
      ## return our own specific promise
      ## so we can spy on the timeout function
      p = Promise.resolve()
      @sandbox.spy(p, "timeout")
      @sandbox.stub(rp.Request.prototype, "promise").returns(p)

      @setup({foo: "bar"}, "abc-123")
      api.createRaygunException({foo: "bar"}, "abc-123").then ->
        expect(p.timeout).to.be.calledWith(3000)

    it "times out after exceeding timeout", (done) ->
      ## force our connection to be delayed 5 seconds
      @setup({foo: "bar"}, "abc-123", 5000)

      ## and set the timeout to only be 50ms
      api.createRaygunException({foo: "bar"}, "abc-123", 50)
      .then ->
        done("errored: it did not catch the timeout error!")
      .catch Promise.TimeoutError, ->
        done()
