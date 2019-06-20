require("../spec_helper")

_        = require("lodash")
os       = require("os")
nmi      = require("node-machine-id")
agent    = require("@packages/network").agent
pkg      = require("@packages/root")
api      = require("#{root}lib/api")
browsers = require("#{root}lib/browsers")
Promise  = require("bluebird")

makeError = (details = {}) ->
  _.extend(new Error(details.message or "Some error"), details)

describe "lib/api", ->
  beforeEach ->
    sinon.stub(os, "platform").returns("linux")

  context ".rp", ->
    beforeEach ->
      sinon.spy(agent, 'addRequest')
      nock.enableNetConnect() ## nock will prevent requests from reaching the agent

    it "makes calls using the correct agent", ->
      api.ping()
      .thenThrow()
      .catch =>
        expect(agent.addRequest).to.be.calledOnce
        expect(agent.addRequest).to.be.calledWithMatch(sinon.match.any, {
          href: 'http://localhost:1234/ping'
        })

    context "with a proxy defined", ->
      beforeEach ->
        @oldEnv = Object.assign({}, process.env)

      it "makes calls using the correct agent", ->
        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = 'http://foo.invalid:1234'
        process.env.NO_PROXY = ''

        api.ping()
        .thenThrow()
        .catch =>
          expect(agent.addRequest).to.be.calledOnce
          expect(agent.addRequest).to.be.calledWithMatch(sinon.match.any, {
            href: 'http://localhost:1234/ping'
          })

      afterEach ->
        process.env = @oldEnv

  context ".getOrgs", ->
    it "GET /orgs + returns orgs", ->
      orgs = []

      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/organizations")
      .reply(200, orgs)

      api.getOrgs("auth-token-123")
      .then (ret) ->
        expect(ret).to.deep.eq(orgs)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects")
      .reply(200, projects)

      api.getProjects("auth-token-123")
      .then (ret) ->
        expect(ret).to.deep.eq(projects)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("accept-encoding", /gzip/)
      .matchHeader("x-route-version", "2")
      .get("/projects/id-123")
      .reply(200, project)

      api.getProject("id-123", "auth-token-123")
      .then (ret) ->
        expect(ret).to.deep.eq(project)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123")
      .reply(500, {})

      api.getProject("id-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".getProjectRuns", ->
    it "GET /projects/:id/runs + returns runs", ->
      runs = []

      nock("http://localhost:1234")
      .matchHeader("x-route-version", "3")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/runs")
      .reply(200, runs)

      api.getProjectRuns("id-123", "auth-token-123")
      .then (ret) ->
        expect(ret).to.deep.eq(runs)

    it "handles timeouts", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/runs")
      .socketDelay(5000)
      .reply(200, [])

      api.getProjectRuns("id-123", "auth-token-123", {timeout: 100})
      .then (ret) ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("Error: ESOCKETTIMEDOUT")

    it "sets timeout to 10 seconds", ->
      sinon.stub(api.rp, "get").returns({
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
        expect(api.rp.get).to.be.calledWithMatch({timeout: 10000})

    it "GET /projects/:id/runs failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/runs")
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
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/runs")
      .reply(500, {})

      api.getProjectRuns("id-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".ping", ->
    it "GET /ping", ->
      nock("http://localhost:1234")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .get("/ping")
      .reply(200, "OK")

      api.ping()
      .then (resp) ->
        expect(resp).to.eq("OK")

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
        group: null
        parallel: null
        ciBuildId: null
        projectId:         "id-123"
        recordKey:         "token-123"
        ci: {
          provider:        "circle"
          buildNumber:     "987"
          params:          { foo: "bar" }
        }
        platform: {}
        commit: {
          sha:         "sha"
          branch:      "master"
          authorName:  "brian"
          authorEmail: "brian@cypress.io"
          message:     "such hax"
          remoteOrigin: "https://github.com/foo/bar.git"
        }
        specs:             ["foo.js", "bar.js"]
      }

    it "POST /runs + returns runId", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "4")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs", @buildProps)
      .reply(200, {
        runId: "new-run-id-123"
      })

      api.createRun(@buildProps)
      .then (ret) ->
        expect(ret).to.deep.eq({ runId: "new-run-id-123" })

    it "POST /runs failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "4")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs", @buildProps)
      .reply(422, {
        errors: {
          runId: ["is required"]
        }
      })

      api.createRun(@buildProps)
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("""
          422

          {
            "errors": {
              "runId": [
                "is required"
              ]
            }
          }
        """)

    it "handles timeouts", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "4")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs")
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
      sinon.stub(api.rp, "post").resolves({runId: 'foo'})

      api.createRun({})
      .then ->
        expect(api.rp.post).to.be.calledWithMatch({timeout: 60000})

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "4")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/runs", @buildProps)
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

      @createProps = {
        runId: "run-id-123"
        spec: "cypress/integration/app_spec.js"
        groupId: "groupId123"
        machineId: "machineId123"
        platform: {}
      }

      @postProps = _.omit(@createProps, "runId")

    it "POSTs /runs/:id/instances", ->
      os.platform.returns("darwin")

      nock("http://localhost:1234")
      .matchHeader("x-route-version", "5")
      .matchHeader("x-os-name", "darwin")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs/run-id-123/instances", @postProps)
      .reply(200, {
        instanceId: "instance-id-123"
      })

      api.createInstance(@createProps)
      .get("instanceId")
      .then (instanceId) ->
        expect(instanceId).to.eq("instance-id-123")

    it "POST /runs/:id/instances failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "5")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs/run-id-123/instances")
      .reply(422, {
        errors: {
          tests: ["is required"]
        }
      })

      api.createInstance({runId: "run-id-123"})
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
      .matchHeader("x-route-version", "5")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs/run-id-123/instances")
      .socketDelay(5000)
      .reply(200, {})

      api.createInstance({
        runId: "run-id-123"
        timeout: 100
      })
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.message).to.eq("Error: ESOCKETTIMEDOUT")

    it "sets timeout to 60 seconds", ->
      sinon.stub(api.rp, "post").resolves({
        instanceId: "instanceId123"
      })

      api.createInstance({})
      .then ->
        expect(api.rp.post).to.be.calledWithMatch({timeout: 60000})

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/runs/run-id-123/instances", @postProps)
      .reply(500, {})

      api.createInstance(@createProps)
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".updateInstance", ->
    beforeEach ->
      @updateProps = {
        instanceId: "instance-id-123"
        stats: {}
        error: "err msg"
        video: true
        screenshots: []
        cypressConfig: {}
        reporterStats: {}
        stdout: "foo\nbar\nbaz"
      }

      @putProps = _.omit(@updateProps, "instanceId")

    it "PUTs /instances/:id", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "2")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123", @putProps)
      .reply(200)

      api.updateInstance(@updateProps)

    it "PUT /instances/:id failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "2")
      .matchHeader("x-os-name", "linux")
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
      .matchHeader("x-route-version", "2")
      .matchHeader("x-os-name", "linux")
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

    it "sets timeout to 60 seconds", ->
      sinon.stub(api.rp, "put").resolves()

      api.updateInstance({})
      .then ->
        expect(api.rp.put).to.be.calledWithMatch({timeout: 60000})

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("x-route-version", "2")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("x-os-name", "linux")
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
      .matchHeader("x-os-name", "linux")
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
      .matchHeader("x-os-name", "linux")
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

    it "sets timeout to 60 seconds", ->
      sinon.stub(api.rp, "put").resolves()

      api.updateInstanceStdout({})
      .then ->
        expect(api.rp.put).to.be.calledWithMatch({timeout: 60000})

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("x-os-name", "linux")
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
      .matchHeader("accept-encoding", /gzip/)
      .get("/auth")
      .reply(500, {})

      api.getLoginUrl()
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".createSignin", ->
    it "POSTs /signin + returns user object", ->
      sinon.stub(nmi, "machineId").resolves("12345")

      nock("http://localhost:1234")
      .matchHeader("x-os-name", "linux")
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
      sinon.stub(nmi, "machineId").rejects(new Error("foo"))

      nock("http://localhost:1234", {
        "badheaders": ["x-machine-id"]
      })
      .matchHeader("x-os-name", "linux")
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
      .matchHeader("x-os-name", "linux")
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
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/signout")
      .reply(200)

      api.createSignout("auth-token-123")

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "2")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/projects", @postProps)
      .reply(200, {
        id: "id-123"
        name: "foobar"
        orgId: "org-id-123"
        public: true
      })

      api.createProject(@createProps, "remoteOrigin", "auth-token-123")
      .then (projectDetails) ->
        expect(projectDetails).to.deep.eq({
          id: "id-123"
          name: "foobar"
          orgId: "org-id-123"
          public: true
        })

    it "POST /projects failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "2")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/keys")
      .reply(200, recordKeys)

      api.getProjectRecordKeys("id-123", "auth-token-123")
      .then (ret) ->
        expect(ret).to.deep.eq(recordKeys)

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("accept-encoding", /gzip/)
      .post("/projects/project-id-123/membership_requests")
      .reply(200)

      api.requestAccess("project-id-123", "auth-token-123")
      .then (ret) ->
        expect(ret).to.be.undefined

    it "POST /projects/:id/membership_requests failure formatting", ->
      nock("http://localhost:1234")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
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
      .matchHeader("accept-encoding", /gzip/)
      .put("/projects/project-id-123/token")
      .reply(500, {})

      api.updateProjectToken("project-123", "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".createCrashReport", ->
    beforeEach ->
      @setup = (body, authToken, delay = 0) ->
        nock("http://localhost:1234")
        .matchHeader("x-os-name", "linux")
        .matchHeader("x-cypress-version", pkg.version)
        .matchHeader("authorization", "Bearer #{authToken}")
        .post("/exceptions", body)
        .delayConnection(delay)
        .reply(200)

    it "POSTs /exceptions", ->
      @setup({foo: "bar"}, "auth-token-123")
      api.createCrashReport({foo: "bar"}, "auth-token-123")

    it "by default times outs after 3 seconds", ->
      ## return our own specific promise
      ## so we can spy on the timeout function
      p = Promise.resolve({})
      sinon.spy(p, "timeout")
      sinon.stub(api.rp, "post").returns(p)

      @setup({foo: "bar"}, "auth-token-123")
      api.createCrashReport({foo: "bar"}, "auth-token-123").then ->
        expect(p.timeout).to.be.calledWith(3000)

    it "times out after exceeding timeout", ->
      ## force our connection to be delayed 5 seconds
      @setup({foo: "bar"}, "auth-token-123", 5000)

      ## and set the timeout to only be 50ms
      api.createCrashReport({foo: "bar"}, "auth-token-123", 50)
      .then ->
        throw new Error("errored: it did not catch the timeout error!")
      .catch Promise.TimeoutError, ->

    it "tags errors", ->
      nock("http://localhost:1234")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/exceptions", {foo: "bar"})
      .reply(500, {})

      api.createCrashReport({foo: "bar"}, "auth-token-123")
      .then ->
        throw new Error("should have thrown here")
      .catch (err) ->
        expect(err.isApiError).to.be.true

  context ".retryWithBackoff", ->
    beforeEach ->
      sinon.stub(Promise, "delay").resolves()

    it "attempts passed-in function", ->
      fn = sinon.stub()
      api.retryWithBackoff(fn).then =>
        expect(fn).to.be.called

    it "retries if function times out", ->
      fn = sinon.stub().rejects(new Promise.TimeoutError())
      fn.onCall(1).resolves()
      api.retryWithBackoff(fn).then =>
        expect(fn).to.be.calledTwice

    it "retries on 5xx errors", ->
      fn1 = sinon.stub().rejects(makeError({ statusCode: 500 }))
      fn1.onCall(1).resolves()

      fn2 = sinon.stub().rejects(makeError({ statusCode: 599 }))
      fn2.onCall(1).resolves()

      api.retryWithBackoff(fn1)
      .then ->
        expect(fn1).to.be.calledTwice
        api.retryWithBackoff(fn2)
      .then ->
        expect(fn2).to.be.calledTwice

    it "retries on error without status code", ->
      fn = sinon.stub().rejects(makeError())
      fn.onCall(1).resolves()

      api.retryWithBackoff(fn)
      .then ->
        expect(fn).to.be.calledTwice

    it "does not retry on non-5xx errors", ->
      fn1 = sinon.stub().rejects(makeError({ message: "499 error", statusCode: 499 }))

      fn2 = sinon.stub().rejects(makeError({ message: "600 error", statusCode: 600 }))

      api.retryWithBackoff(fn1)
      .then ->
        throw new Error("Should not resolve 499 error")
      .catch (err) ->
        expect(err.message).to.equal("499 error")
        api.retryWithBackoff(fn2)
      .then ->
        throw new Error("Should not resolve 600 error")
      .catch (err) ->
        expect(err.message).to.equal("600 error")

    it "backs off with strategy: 30s, 60s, 2m", ->
      fn = sinon.stub().rejects(new Promise.TimeoutError())
      fn.onCall(3).resolves()
      api.retryWithBackoff(fn).then =>
        expect(Promise.delay).to.be.calledThrice
        expect(Promise.delay.firstCall).to.be.calledWith(30 * 1000)
        expect(Promise.delay.secondCall).to.be.calledWith(60 * 1000)
        expect(Promise.delay.thirdCall).to.be.calledWith(2 * 60 * 1000)

    it "fails after third retry fails", ->
      fn = sinon.stub().rejects(makeError({ message: "500 error", statusCode: 500 }))
      api.retryWithBackoff(fn)
      .then ->
        throw new Error("Should not resolve")
      .catch (err) =>
        expect(err.message).to.equal("500 error")

    it "calls onBeforeRetry before each retry", ->
      err = makeError({ message: "500 error", statusCode: 500 })
      onBeforeRetry = sinon.stub()
      fn = sinon.stub().rejects(err)
      fn.onCall(3).resolves()
      api.retryWithBackoff(fn, { onBeforeRetry }).then =>
        expect(onBeforeRetry).to.be.calledThrice
        expect(onBeforeRetry.firstCall.args[0]).to.eql({
          retryIndex: 0
          delay: 30 * 1000
          total: 3
          err
        })
        expect(onBeforeRetry.secondCall.args[0]).to.eql({
          retryIndex: 1
          delay: 60 * 1000
          total: 3
          err
        })
        expect(onBeforeRetry.thirdCall.args[0]).to.eql({
          retryIndex: 2
          delay: 2 * 60 * 1000
          total: 3
          err
        })
