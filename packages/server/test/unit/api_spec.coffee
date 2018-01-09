require("../spec_helper")

_        = require("lodash")
rp       = require("request-promise")
os       = require("os")
nmi      = require("node-machine-id")
pkg      = require("@packages/root")
api      = require("#{root}lib/api")
browsers = require("#{root}lib/browsers")
Promise  = require("bluebird")

describe "lib/api", ->
  beforeEach ->
    @sandbox.stub(os, "platform").returns("linux")

  context ".getOrgs", ->
    it "GET /orgs + returns orgs", ->
      orgs = []

      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/organizations")
      .reply(200, orgs)

      api.getOrgs("auth-token-123")
      .then (ret) ->
        expect(ret).to.eql(orgs)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/organizations")
      .reply(500, {})

      api.getOrgs("auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".getProjects", ->
    it "GET /projects + returns projects", ->
      projects = []

      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects")
      .reply(200, projects)

      api.getProjects("auth-token-123")
      .then (ret) ->
        expect(ret).to.eql(projects)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects")
      .reply(500, {})

      api.getProjects("auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".getProject", ->
    it "GET /projects/:id + returns project", ->
      project = { id: "id-123" }

      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("x-route-version", "2")
      .get("/projects/id-123")
      .reply(200, project)

      api.getProject("id-123", "auth-token-123")
      .then (ret) ->
        expect(ret).to.eql(project)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/id-123")
      .reply(500, {})

      api.getProject("id-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".getProjectRuns", ->
    it "GET /projects/:id/builds + returns builds", ->
      builds = []

      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/id-123/builds")
      .reply(200, builds)

      api.getProjectRuns("id-123", "auth-token-123")
      .then (ret) ->
        expect(ret).to.eql(builds)

    it "handles timeouts", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/id-123/builds")
      .socketDelay(5000)
      .reply(200, [])

      api.getProjectRuns("id-123", "auth-token-123", {timeout: 100})
      .then (ret) ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("Error: ESOCKETTIMEDOUT")

    it "sets timeout to 10 seconds", ->
      @sandbox.stub(rp, "get").returns({
        catch: -> {
          catch: -> {
            then: (fn) -> fn()
          }
          then: (fn) -> fn()
        }
        then: (fn) -> fn()
      })

      api.getProjectRuns("id-123", "auth-token-123")
      .then (ret) ->
        expect(rp.get).to.be.calledWithMatch({timeout: 10000})

    it "GET /projects/:id/builds failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/id-123/builds")
      .reply(401, {
        errors: {
          permission: ["denied"]
        }
      })

      api.getProjectRuns("id-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("""
          401

          {
            "errors": {
              "permission": [
                "denied"
              ]
            }
          }
        """)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/id-123/builds")
      .reply(500, {})

      api.getProjectRuns("id-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

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

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/ping")
      .reply(500, {})

      api.ping()
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".createRun", ->
    beforeEach ->
      @buildProps = {
        projectId:         "id-123"
        recordKey:         "token-123"
        commitSha:         "sha"
        commitBranch:      "master"
        commitAuthorName:  "brian"
        commitAuthorEmail: "brian@cypress.io"
        commitMessage:     "such hax"
        remoteOrigin:      "https://github.com/foo/bar.git"
        ciProvider:        "circle"
        ciBuildNumber:     "987"
        ciParams:          { foo: "bar" }
        specs:             ["foo.js", "bar.js"]
      }

    it "POST /builds + returns buildId", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "2")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds", @buildProps)
      .reply(200, {
        buildId: "new-build-id-123"
      })

      api.createRun(@buildProps)
      .then (ret) ->
        expect(ret).to.eq("new-build-id-123")

    it "POST /builds failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "2")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds", {
        projectId:         null
        recordKey:         "token-123"
        commitSha:         "sha"
        commitBranch:      "master"
        commitAuthorName:  "brian"
        commitAuthorEmail: "brian@cypress.io"
        commitMessage:     "such hax"
        remoteOrigin:      "https://github.com/foo/bar.git"
        ciProvider:        "circle"
        ciBuildNumber:     "987"
        ciParams:          { foo: "bar" }
      })
      .reply(422, {
        errors: {
          buildId: ["is required"]
        }
      })

      api.createRun({
        projectId:         null
        recordKey:         "token-123"
        commitSha:         "sha"
        commitBranch:      "master"
        commitAuthorName:  "brian"
        commitAuthorEmail: "brian@cypress.io"
        commitMessage:     "such hax"
        remoteOrigin:      "https://github.com/foo/bar.git"
        ciProvider:        "circle"
        ciBuildNumber:     "987"
        ciParams:          { foo: "bar" }
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

      api.createRun({
        timeout: 100
      })
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("Error: ESOCKETTIMEDOUT")

    it "sets timeout to 10 seconds", ->
      @sandbox.stub(rp, "post").returns({
        promise: () -> Promise.resolve({buildId: 'foo'})
      })

      api.createRun({})
      .then ->
        expect(rp.post).to.be.calledWithMatch({timeout: 10000})

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/builds", @buildProps)
      .reply(500, {})

      api.createRun(@buildProps)
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".createInstance", ->
    beforeEach ->
      Object.defineProperty(process.versions, "chrome", {
        value: "53"
      })

      @postProps = {
        spec: "cypress/integration/app_spec.js"
        browserName: "Foo"
        browserVersion: "1.2.3"
        osName: "darwin"
        osVersion: "10.10.10"
        osCpus: [{model: "foo"}]
        osMemory: {
          free:  1000
          total: 2000
        }
      }

      @createProps = {
        buildId: "build-id-123"
        browser: "foo"
        spec: "cypress/integration/app_spec.js"
      }

    it "POSTs /builds/:id/instances", ->
      @sandbox.stub(os, "release").returns("10.10.10")
      @sandbox.stub(os, "cpus").returns([{model: "foo"}])
      @sandbox.stub(os, "freemem").returns(1000)
      @sandbox.stub(os, "totalmem").returns(2000)
      @sandbox.stub(browsers, "getByName").resolves({
        displayName: "Foo"
        version: "1.2.3"
      })

      os.platform.returns("darwin")

      nock("http://localhost:1234")
      .matchHeader("x-route-version", "3")
      .matchHeader("x-platform", "darwin")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/builds/build-id-123/instances", @postProps)
      .reply(200, {
        instanceId: "instance-id-123"
      })

      api.createInstance(@createProps)
      .then (instanceId) ->
        expect(browsers.getByName).to.be.calledWith("foo")
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
        promise: -> {
          get: -> {
            catch: -> {
              catch: -> {
                then: (fn) -> fn()
              }
              then: (fn) -> fn()
            }
          }
        }
      })

      api.createInstance({})
      .then ->
        expect(rp.post).to.be.calledWithMatch({timeout: 10000})

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/builds/build-id-123/instances", @postProps)
      .reply(500, {})

      api.createInstance(@createProps)
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".updateInstance", ->
    beforeEach ->
      Object.defineProperty(process.versions, "chrome", {
        value: "53"
      })

      @putProps = {
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
        stdout: "foo\nbar\nbaz"
      }

      @updateProps = {
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
        ciProvider: "circle"
        stdout: "foo\nbar\nbaz"
      }

    it "PUTs /instances/:id", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123", @putProps)
      .reply(200)

      api.updateInstance(@updateProps)

    it "PUT /instances/:id failure formatting", ->
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

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .put("/instances/instance-id-123", @putProps)
      .reply(500, {})

      api.updateInstance(@updateProps)
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".updateInstanceStdout", ->
    it "PUTs /instances/:id/stdout", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123/stdout", {
        stdout: "foobarbaz\n"
      })
      .reply(200)

      api.updateInstanceStdout({
        instanceId: "instance-id-123"
        stdout: "foobarbaz\n"
      })

    it "PUT /instances/:id/stdout failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123/stdout")
      .reply(422, {
        errors: {
          tests: ["is required"]
        }
      })

      api.updateInstanceStdout({instanceId: "instance-id-123"})
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
      .put("/instances/instance-id-123/stdout")
      .socketDelay(5000)
      .reply(200, {})

      api.updateInstanceStdout({
        instanceId: "instance-id-123"
        timeout: 100
      })
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("Error: ESOCKETTIMEDOUT")

    it "sets timeout to 10 seconds", ->
      @sandbox.stub(rp, "put").resolves()

      api.updateInstanceStdout({})
      .then ->
        expect(rp.put).to.be.calledWithMatch({timeout: 10000})

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .put("/instances/instance-id-123/stdout", {
        stdout: "foobarbaz\n"
      })
      .reply(500, {})

      api.updateInstanceStdout({
        instanceId: "instance-id-123"
        stdout: "foobarbaz\n"
      })
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

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

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/auth")
      .reply(500, {})

      api.getLoginUrl()
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".createSignin", ->
    it "POSTs /signin + returns user object", ->
      @sandbox.stub(nmi, "machineId").resolves("12345")

      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "3")
      .matchHeader("x-machine-id", "12345")
      .post("/signin")
      .query({code: "abc-123"})
      .reply(200, {
        name: "brian"
      })

      api.createSignin("abc-123").then (user) ->
        expect(user).to.deep.eq({
          name: "brian"
        })

    it "handles nmi errors", ->
      @sandbox.stub(nmi, "machineId").rejects(new Error("foo"))

      nock("http://localhost:1234", {
        "badheaders": ["x-machine-id"]
      })
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "3")
      .matchHeader("x-accept-terms", "true")
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
      .matchHeader("x-route-version", "3")
      .post("/signin")
      .query({code: "abc-123"})
      .reply(401, "Your email: 'brian@gmail.com' has not been authorized.")

      api.createSignin("abc-123")
      .then ->
        throw new Error("should have thrown error")
      .catch (err) ->
        expect(err.message).to.eq("Your email: 'brian@gmail.com' has not been authorized.")

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/signin")
      .reply(500, {})

      api.createSignin("abc-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".createSignout", ->
    it "POSTs /signout", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/signout")
      .reply(200)

      api.createSignout("auth-token-123")

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/signout")
      .reply(500, {})

      api.createSignout("auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".createProject", ->
    beforeEach ->
      @postProps = {
        name: "foobar"
        orgId: "org-id-123"
        public: true
        remoteOrigin: "remoteOrigin"
      }

      @createProps = {
        projectName: "foobar"
        orgId: "org-id-123"
        public: true
      }

    it "POST /projects", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "2")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/projects", @postProps)
      .reply(200, {
        id: "id-123"
        name: "foobar"
        orgId: "org-id-123"
        public: true
      })

      api.createProject(@createProps, "remoteOrigin", "auth-token-123")
      .then (projectDetails) ->
        expect(projectDetails).to.eql({
          id: "id-123"
          name: "foobar"
          orgId: "org-id-123"
          public: true
        })

    it "POST /projects failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "2")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/projects", {
        name: "foobar"
        orgId: "org-id-123"
        public: true
        remoteOrigin: "remoteOrigin"
      })
      .reply(422, {
        errors: {
          orgId: ["is required"]
        }
      })

      projectDetails = {
        projectName: "foobar"
        orgId: "org-id-123"
        public: true
      }

      api.createProject(projectDetails, "remoteOrigin", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("""
          422

          {
            "errors": {
              "orgId": [
                "is required"
              ]
            }
          }
        """)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/projects", @postProps)
      .reply(500, {})

      api.createProject(@createProps, "remoteOrigin", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".getProjectRecordKeys", ->
    it "GET /projects/:id/keys + returns keys", ->
      recordKeys = []

      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/id-123/keys")
      .reply(200, recordKeys)

      api.getProjectRecordKeys("id-123", "auth-token-123")
      .then (ret) ->
        expect(ret).to.eql(recordKeys)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/id-123/keys")
      .reply(500, {})

      api.getProjectRecordKeys("id-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".requestAccess", ->
    it "POST /projects/:id/membership_requests + returns response", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/projects/project-id-123/membership_requests")
      .reply(200)

      api.requestAccess("project-id-123", "auth-token-123")
      .then (ret) ->
        expect(ret).to.be.undefined

    it "POST /projects/:id/membership_requests failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/projects/project-id-123/membership_requests")
      .reply(422, {
        errors: {
          access: ["already requested"]
        }
      })

      api.requestAccess("project-id-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("""
          422

          {
            "errors": {
              "access": [
                "already requested"
              ]
            }
          }
        """)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/projects/project-id-123/membership_requests")
      .reply(500, {})

      api.requestAccess("project-id-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".getProjectToken", ->
    it "GETs /projects/:id/token", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/project-123/token")
      .reply(200, {
        apiToken: "token-123"
      })

      api.getProjectToken("project-123", "auth-token-123")
      .then (resp) ->
        expect(resp).to.eq("token-123")

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .get("/projects/project-123/token")
      .reply(500, {})

      api.getProjectToken("project-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".updateProjectToken", ->
    it "PUTs /projects/:id/token", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .put("/projects/project-123/token")
      .reply(200, {
        apiToken: "token-123"
      })

      api.updateProjectToken("project-123", "auth-token-123")
      .then (resp) ->
        expect(resp).to.eq("token-123")

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .put("/projects/project-id-123/token")
      .reply(500, {})

      api.updateProjectToken("project-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".createRaygunException", ->
    beforeEach ->
      @setup = (body, authToken, delay = 0) ->
        nock("http://localhost:1234")
        .matchHeader("x-platform", "linux")
        .matchHeader("x-cypress-version", pkg.version)
        .matchHeader("authorization", "Bearer #{authToken}")
        .post("/exceptions", body)
        .delayConnection(delay)
        .reply(200)

    it "POSTs /exceptions", ->
      @setup({foo: "bar"}, "auth-token-123")
      api.createRaygunException({foo: "bar"}, "auth-token-123")

    it "by default times outs after 3 seconds", ->
      ## return our own specific promise
      ## so we can spy on the timeout function
      p = Promise.resolve()
      @sandbox.spy(p, "timeout")
      @sandbox.stub(rp.Request.prototype, "promise").returns(p)

      @setup({foo: "bar"}, "auth-token-123")
      api.createRaygunException({foo: "bar"}, "auth-token-123").then ->
        expect(p.timeout).to.be.calledWith(3000)

    it "times out after exceeding timeout", ->
      ## force our connection to be delayed 5 seconds
      @setup({foo: "bar"}, "auth-token-123", 5000)

      ## and set the timeout to only be 50ms
      api.createRaygunException({foo: "bar"}, "auth-token-123", 50)
      .then ->
        throw new Error("errored: it did not catch the timeout error!")
      .catch Promise.TimeoutError, ->

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .post("/exceptions", {foo: "bar"})
      .reply(500, {})

      api.createRaygunException({foo: "bar"}, "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true
