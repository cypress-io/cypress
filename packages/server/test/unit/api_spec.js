/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _        = require("lodash");
const os       = require("os");
const {
  agent
} = require("@packages/network");
const pkg      = require("@packages/root");
const api      = require(`${root}lib/api`);
const browsers = require(`${root}lib/browsers`);
const cache    = require(`${root}lib/cache`);
const machineId = require(`${root}lib/util/machine_id`);
const Promise  = require("bluebird");

const API_BASEURL = "http://localhost:1234";
const DASHBOARD_BASEURL = "http://localhost:3000";
const AUTH_URLS = {
  "dashboardAuthUrl": "http://localhost:3000/test-runner.html",
  "dashboardLogoutUrl": "http://localhost:3000/logout"
};

const makeError = (details = {}) => _.extend(new Error(details.message || "Some error"), details);

describe("lib/api", function() {
  beforeEach(function() {
    nock(API_BASEURL)
    .matchHeader("x-route-version", "2")
    .get("/auth")
    .reply(200, AUTH_URLS);

    api.clearCache();
    sinon.stub(os, "platform").returns("linux");

    return sinon.stub(cache, 'getUser').resolves({
      name: 'foo bar',
      email: 'foo@bar'
      //authToken: 'auth-token-123'
    });
  });

  context(".rp", function() {
    beforeEach(function() {
      sinon.spy(agent, 'addRequest');
      return nock.enableNetConnect();
    }); //# nock will prevent requests from reaching the agent

    it("makes calls using the correct agent", function() {
      nock.cleanAll();
      return api.ping()
      .thenThrow()
      .catch(() => {
        expect(agent.addRequest).to.be.calledOnce;
        return expect(agent.addRequest).to.be.calledWithMatch(sinon.match.any, {
          href: 'http://localhost:1234/ping'
        });
      });
    });

    return context("with a proxy defined", function() {
      beforeEach(function() {
        nock.cleanAll();
        return this.oldEnv = Object.assign({}, process.env);
      });

      it("makes calls using the correct agent", function() {
        process.env.HTTP_PROXY = (process.env.HTTPS_PROXY = 'http://foo.invalid:1234');
        process.env.NO_PROXY = '';

        return api.ping()
        .thenThrow()
        .catch(() => {
          expect(agent.addRequest).to.be.calledOnce;
          return expect(agent.addRequest).to.be.calledWithMatch(sinon.match.any, {
            href: 'http://localhost:1234/ping'
          });
        });
      });

      return afterEach(function() {
        return process.env = this.oldEnv;
      });
    });
  });

  context(".getOrgs", function() {
    it("GET /orgs + returns orgs", function() {
      const orgs = [];

      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/organizations")
      .reply(200, orgs);

      return api.getOrgs("auth-token-123")
      .then(ret => expect(ret).to.deep.eq(orgs));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/organizations")
      .reply(500, {});

      return api.getOrgs("auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".getProjects", function() {
    it("GET /projects + returns projects", function() {
      const projects = [];

      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects")
      .reply(200, projects);

      return api.getProjects("auth-token-123")
      .then(ret => expect(ret).to.deep.eq(projects));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects")
      .reply(500, {});

      return api.getProjects("auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".getProject", function() {
    it("GET /projects/:id + returns project", function() {
      const project = { id: "id-123" };

      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .matchHeader("x-route-version", "2")
      .get("/projects/id-123")
      .reply(200, project);

      return api.getProject("id-123", "auth-token-123")
      .then(ret => expect(ret).to.deep.eq(project));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123")
      .reply(500, {});

      return api.getProject("id-123", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".getProjectRuns", function() {
    it("GET /projects/:id/runs + returns runs", function() {
      const runs = [];

      nock(API_BASEURL)
      .matchHeader("x-route-version", "3")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/runs")
      .reply(200, runs);

      return api.getProjectRuns("id-123", "auth-token-123")
      .then(ret => expect(ret).to.deep.eq(runs));
    });

    it("handles timeouts", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/runs")
      .socketDelay(5000)
      .reply(200, []);

      return api.getProjectRuns("id-123", "auth-token-123", {timeout: 100})
      .then(function(ret) {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq("Error: ESOCKETTIMEDOUT"));
    });

    it("sets timeout to 10 seconds", function() {
      sinon.stub(api.rp, "get").returns({
        catch() { return {
          catch() { return {
            then(fn) { return fn(); }
          }; },
          then(fn) { return fn(); }
        }; },
        then(fn) { return fn(); }
      });

      return api.getProjectRuns("id-123", "auth-token-123")
      .then(ret => expect(api.rp.get).to.be.calledWithMatch({timeout: 10000}));
    });

    it("GET /projects/:id/runs failure formatting", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/runs")
      .twice()
      .reply(401, {
        errors: {
          permission: ["denied"]
        }
      });

      return api.getProjectRuns("id-123", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq(`\
401

{
"errors": {
  "permission": [
    "denied"
  ]
}
}\
`));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/runs")
      .reply(500, {});

      return api.getProjectRuns("id-123", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".ping", function() {
    it("GET /ping", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .get("/ping")
      .reply(200, "OK");

      return api.ping()
      .then(resp => expect(resp).to.eq("OK"));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/ping")
      .reply(500, {});

      return api.ping()
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".createRun", function() {
    beforeEach(function() {
      return this.buildProps = {
        group: null,
        parallel: null,
        ciBuildId: null,
        projectId:         "id-123",
        recordKey:         "token-123",
        ci: {
          provider:        "circle",
          buildNumber:     "987",
          params:          { foo: "bar" }
        },
        platform: {},
        commit: {
          sha:         "sha",
          branch:      "master",
          authorName:  "brian",
          authorEmail: "brian@cypress.io",
          message:     "such hax",
          remoteOrigin: "https://github.com/foo/bar.git"
        },
        specs:             ["foo.js", "bar.js"]
      };});

    it("POST /runs + returns runId", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "4")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs", this.buildProps)
      .reply(200, {
        runId: "new-run-id-123"
      });

      return api.createRun(this.buildProps)
      .then(ret => expect(ret).to.deep.eq({ runId: "new-run-id-123" }));
    });

    it("POST /runs failure formatting", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "4")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs", this.buildProps)
      .reply(422, {
        errors: {
          runId: ["is required"]
        }
      });

      return api.createRun(this.buildProps)
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq(`\
422

{
"errors": {
  "runId": [
    "is required"
  ]
}
}\
`));
    });

    it("handles timeouts", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "4")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs")
      .socketDelay(5000)
      .reply(200, {});

      return api.createRun({
        timeout: 100
      })
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq("Error: ESOCKETTIMEDOUT"));
    });

    it("sets timeout to 10 seconds", function() {
      sinon.stub(api.rp, "post").resolves({runId: 'foo'});

      return api.createRun({})
      .then(() => expect(api.rp.post).to.be.calledWithMatch({timeout: 60000}));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "4")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/runs", this.buildProps)
      .reply(500, {});

      return api.createRun(this.buildProps)
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".createInstance", function() {
    beforeEach(function() {
      Object.defineProperty(process.versions, "chrome", {
        value: "53"
      });

      this.createProps = {
        runId: "run-id-123",
        spec: "cypress/integration/app_spec.js",
        groupId: "groupId123",
        machineId: "machineId123",
        platform: {}
      };

      return this.postProps = _.omit(this.createProps, "runId");
    });

    it("POSTs /runs/:id/instances", function() {
      os.platform.returns("darwin");

      nock(API_BASEURL)
      .matchHeader("x-route-version", "5")
      .matchHeader("x-os-name", "darwin")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs/run-id-123/instances", this.postProps)
      .reply(200, {
        instanceId: "instance-id-123"
      });

      return api.createInstance(this.createProps)
      .get("instanceId")
      .then(instanceId => expect(instanceId).to.eq("instance-id-123"));
    });

    it("POST /runs/:id/instances failure formatting", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "5")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs/run-id-123/instances")
      .reply(422, {
        errors: {
          tests: ["is required"]
        }
      });

      return api.createInstance({runId: "run-id-123"})
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq(`\
422

{
"errors": {
  "tests": [
    "is required"
  ]
}
}\
`));
    });

    it("handles timeouts", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "5")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .post("/runs/run-id-123/instances")
      .socketDelay(5000)
      .reply(200, {});

      return api.createInstance({
        runId: "run-id-123",
        timeout: 100
      })
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq("Error: ESOCKETTIMEDOUT"));
    });

    it("sets timeout to 60 seconds", function() {
      sinon.stub(api.rp, "post").resolves({
        instanceId: "instanceId123"
      });

      return api.createInstance({})
      .then(() => expect(api.rp.post).to.be.calledWithMatch({timeout: 60000}));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/runs/run-id-123/instances", this.postProps)
      .reply(500, {});

      return api.createInstance(this.createProps)
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".updateInstance", function() {
    beforeEach(function() {
      this.updateProps = {
        instanceId: "instance-id-123",
        stats: {},
        error: "err msg",
        video: true,
        screenshots: [],
        cypressConfig: {},
        reporterStats: {},
        stdout: "foo\nbar\nbaz"
      };

      return this.putProps = _.omit(this.updateProps, "instanceId");
    });

    it("PUTs /instances/:id", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "2")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123", this.putProps)
      .reply(200);

      return api.updateInstance(this.updateProps);
    });

    it("PUT /instances/:id failure formatting", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "2")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123")
      .reply(422, {
        errors: {
          tests: ["is required"]
        }
      });

      return api.updateInstance({instanceId: "instance-id-123"})
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq(`\
422

{
"errors": {
  "tests": [
    "is required"
  ]
}
}\
`));
    });

    it("handles timeouts", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "2")
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123")
      .socketDelay(5000)
      .reply(200, {});

      return api.updateInstance({
        instanceId: "instance-id-123",
        timeout: 100
      })
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq("Error: ESOCKETTIMEDOUT"));
    });

    it("sets timeout to 60 seconds", function() {
      sinon.stub(api.rp, "put").resolves();

      return api.updateInstance({})
      .then(() => expect(api.rp.put).to.be.calledWithMatch({timeout: 60000}));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("x-route-version", "2")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .put("/instances/instance-id-123", this.putProps)
      .reply(500, {});

      return api.updateInstance(this.updateProps)
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".updateInstanceStdout", function() {
    it("PUTs /instances/:id/stdout", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123/stdout", {
        stdout: "foobarbaz\n"
      })
      .reply(200);

      return api.updateInstanceStdout({
        instanceId: "instance-id-123",
        stdout: "foobarbaz\n"
      });
    });

    it("PUT /instances/:id/stdout failure formatting", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123/stdout")
      .reply(422, {
        errors: {
          tests: ["is required"]
        }
      });

      return api.updateInstanceStdout({instanceId: "instance-id-123"})
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq(`\
422

{
"errors": {
  "tests": [
    "is required"
  ]
}
}\
`));
    });

    it("handles timeouts", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .put("/instances/instance-id-123/stdout")
      .socketDelay(5000)
      .reply(200, {});

      return api.updateInstanceStdout({
        instanceId: "instance-id-123",
        timeout: 100
      })
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq("Error: ESOCKETTIMEDOUT"));
    });

    it("sets timeout to 60 seconds", function() {
      sinon.stub(api.rp, "put").resolves();

      return api.updateInstanceStdout({})
      .then(() => expect(api.rp.put).to.be.calledWithMatch({timeout: 60000}));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .put("/instances/instance-id-123/stdout", {
        stdout: "foobarbaz\n"
      })
      .reply(500, {});

      return api.updateInstanceStdout({
        instanceId: "instance-id-123",
        stdout: "foobarbaz\n"
      })
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".getAuthUrls", function() {
    it("GET /auth + returns the urls", () => api.getAuthUrls().then(urls => expect(urls).to.deep.eq(AUTH_URLS)));

    it("tags errors", function() {
      nock.cleanAll();

      nock(API_BASEURL)
      .matchHeader("accept-encoding", /gzip/)
      .matchHeader("x-route-version", "2")
      .get("/auth")
      .reply(500, {});

      return api.getAuthUrls()
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });

    return it("caches the response from the first request", () => api.getAuthUrls()
    .then(() => // nock will throw if this makes a second HTTP call
    api.getAuthUrls()).then(urls => expect(urls).to.deep.eq(AUTH_URLS)));
  });

  context(".postLogout", function() {
    beforeEach(() => sinon.stub(machineId, 'machineId').resolves('foo'));

    it("POSTs /logout", function() {
      nock(DASHBOARD_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-machine-id", "foo")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/logout")
      .reply(200);

      return api.postLogout("auth-token-123");
    });

    return it("tags errors", function() {
      nock(DASHBOARD_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-machine-id", "foo")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/logout")
      .reply(500, {});

      return api.postLogout("auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".createProject", function() {
    beforeEach(function() {
      this.postProps = {
        name: "foobar",
        orgId: "org-id-123",
        public: true,
        remoteOrigin: "remoteOrigin"
      };

      return this.createProps = {
        projectName: "foobar",
        orgId: "org-id-123",
        public: true
      };});

    it("POST /projects", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "2")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/projects", this.postProps)
      .reply(200, {
        id: "id-123",
        name: "foobar",
        orgId: "org-id-123",
        public: true
      });

      return api.createProject(this.createProps, "remoteOrigin", "auth-token-123")
      .then(projectDetails => expect(projectDetails).to.deep.eq({
        id: "id-123",
        name: "foobar",
        orgId: "org-id-123",
        public: true
      }));
    });

    it("POST /projects failure formatting", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("x-route-version", "2")
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/projects", {
        name: "foobar",
        orgId: "org-id-123",
        public: true,
        remoteOrigin: "remoteOrigin"
      })
      .reply(422, {
        errors: {
          orgId: ["is required"]
        }
      });

      const projectDetails = {
        projectName: "foobar",
        orgId: "org-id-123",
        public: true
      };

      return api.createProject(projectDetails, "remoteOrigin", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq(`\
422

{
"errors": {
  "orgId": [
    "is required"
  ]
}
}\
`));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/projects", this.postProps)
      .reply(500, {});

      return api.createProject(this.createProps, "remoteOrigin", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".getProjectRecordKeys", function() {
    it("GET /projects/:id/keys + returns keys", function() {
      const recordKeys = [];

      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/keys")
      .reply(200, recordKeys);

      return api.getProjectRecordKeys("id-123", "auth-token-123")
      .then(ret => expect(ret).to.deep.eq(recordKeys));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/id-123/keys")
      .reply(500, {});

      return api.getProjectRecordKeys("id-123", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".requestAccess", function() {
    it("POST /projects/:id/membership_requests + returns response", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/projects/project-id-123/membership_requests")
      .reply(200);

      return api.requestAccess("project-id-123", "auth-token-123")
      .then(ret => expect(ret).to.be.undefined);
    });

    it("POST /projects/:id/membership_requests failure formatting", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/projects/project-id-123/membership_requests")
      .reply(422, {
        errors: {
          access: ["already requested"]
        }
      });

      return api.requestAccess("project-id-123", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.message).to.eq(`\
422

{
"errors": {
  "access": [
    "already requested"
  ]
}
}\
`));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/projects/project-id-123/membership_requests")
      .reply(500, {});

      return api.requestAccess("project-id-123", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".getProjectToken", function() {
    it("GETs /projects/:id/token", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/project-123/token")
      .reply(200, {
        apiToken: "token-123"
      });

      return api.getProjectToken("project-123", "auth-token-123")
      .then(resp => expect(resp).to.eq("token-123"));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .get("/projects/project-123/token")
      .reply(500, {});

      return api.getProjectToken("project-123", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".updateProjectToken", function() {
    it("PUTs /projects/:id/token", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .put("/projects/project-123/token")
      .reply(200, {
        apiToken: "token-123"
      });

      return api.updateProjectToken("project-123", "auth-token-123")
      .then(resp => expect(resp).to.eq("token-123"));
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .put("/projects/project-id-123/token")
      .reply(500, {});

      return api.updateProjectToken("project-123", "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  context(".createCrashReport", function() {
    beforeEach(function() {
      return this.setup = (body, authToken, delay = 0) => nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", `Bearer ${authToken}`)
      .post("/exceptions", body)
      .delayConnection(delay)
      .reply(200);
    });

    it("POSTs /exceptions", function() {
      this.setup({foo: "bar"}, "auth-token-123");
      return api.createCrashReport({foo: "bar"}, "auth-token-123");
    });

    it("by default times outs after 3 seconds", function() {
      //# return our own specific promise
      //# so we can spy on the timeout function
      const p = Promise.resolve({});
      sinon.spy(p, "timeout");
      sinon.stub(api.rp, "post").returns(p);

      this.setup({foo: "bar"}, "auth-token-123");
      return api.createCrashReport({foo: "bar"}, "auth-token-123").then(() => expect(p.timeout).to.be.calledWith(3000));
    });

    it("times out after exceeding timeout", function() {
      //# force our connection to be delayed 5 seconds
      this.setup({foo: "bar"}, "auth-token-123", 5000);

      //# and set the timeout to only be 50ms
      return api.createCrashReport({foo: "bar"}, "auth-token-123", 50)
      .then(function() {
        throw new Error("errored: it did not catch the timeout error!");}).catch(Promise.TimeoutError, function() {});
    });

    return it("tags errors", function() {
      nock(API_BASEURL)
      .matchHeader("x-os-name", "linux")
      .matchHeader("x-cypress-version", pkg.version)
      .matchHeader("authorization", "Bearer auth-token-123")
      .matchHeader("accept-encoding", /gzip/)
      .post("/exceptions", {foo: "bar"})
      .reply(500, {});

      return api.createCrashReport({foo: "bar"}, "auth-token-123")
      .then(function() {
        throw new Error("should have thrown here");}).catch(err => expect(err.isApiError).to.be.true);
    });
  });

  return context(".retryWithBackoff", function() {
    beforeEach(() => sinon.stub(Promise, "delay").resolves());

    it("attempts passed-in function", function() {
      const fn = sinon.stub();
      return api.retryWithBackoff(fn).then(() => {
        return expect(fn).to.be.called;
      });
    });

    it("retries if function times out", function() {
      const fn = sinon.stub().rejects(new Promise.TimeoutError());
      fn.onCall(1).resolves();
      return api.retryWithBackoff(fn).then(() => {
        return expect(fn).to.be.calledTwice;
      });
    });

    it("retries on 5xx errors", function() {
      const fn1 = sinon.stub().rejects(makeError({ statusCode: 500 }));
      fn1.onCall(1).resolves();

      const fn2 = sinon.stub().rejects(makeError({ statusCode: 599 }));
      fn2.onCall(1).resolves();

      return api.retryWithBackoff(fn1)
      .then(function() {
        expect(fn1).to.be.calledTwice;
        return api.retryWithBackoff(fn2);}).then(() => expect(fn2).to.be.calledTwice);
    });

    it("retries on error without status code", function() {
      const fn = sinon.stub().rejects(makeError());
      fn.onCall(1).resolves();

      return api.retryWithBackoff(fn)
      .then(() => expect(fn).to.be.calledTwice);
    });

    it("does not retry on non-5xx errors", function() {
      const fn1 = sinon.stub().rejects(makeError({ message: "499 error", statusCode: 499 }));

      const fn2 = sinon.stub().rejects(makeError({ message: "600 error", statusCode: 600 }));

      return api.retryWithBackoff(fn1)
      .then(function() {
        throw new Error("Should not resolve 499 error");}).catch(function(err) {
        expect(err.message).to.equal("499 error");
        return api.retryWithBackoff(fn2);}).then(function() {
        throw new Error("Should not resolve 600 error");}).catch(err => expect(err.message).to.equal("600 error"));
    });

    it("backs off with strategy: 30s, 60s, 2m", function() {
      const fn = sinon.stub().rejects(new Promise.TimeoutError());
      fn.onCall(3).resolves();
      return api.retryWithBackoff(fn).then(() => {
        expect(Promise.delay).to.be.calledThrice;
        expect(Promise.delay.firstCall).to.be.calledWith(30 * 1000);
        expect(Promise.delay.secondCall).to.be.calledWith(60 * 1000);
        return expect(Promise.delay.thirdCall).to.be.calledWith(2 * 60 * 1000);
      });
    });

    it("fails after third retry fails", function() {
      const fn = sinon.stub().rejects(makeError({ message: "500 error", statusCode: 500 }));
      return api.retryWithBackoff(fn)
      .then(function() {
        throw new Error("Should not resolve");}).catch(err => {
        return expect(err.message).to.equal("500 error");
      });
    });

    return it("calls onBeforeRetry before each retry", function() {
      const err = makeError({ message: "500 error", statusCode: 500 });
      const onBeforeRetry = sinon.stub();
      const fn = sinon.stub().rejects(err);
      fn.onCall(3).resolves();
      return api.retryWithBackoff(fn, { onBeforeRetry }).then(() => {
        expect(onBeforeRetry).to.be.calledThrice;
        expect(onBeforeRetry.firstCall.args[0]).to.eql({
          retryIndex: 0,
          delay: 30 * 1000,
          total: 3,
          err
        });
        expect(onBeforeRetry.secondCall.args[0]).to.eql({
          retryIndex: 1,
          delay: 60 * 1000,
          total: 3,
          err
        });
        return expect(onBeforeRetry.thirdCall.args[0]).to.eql({
          retryIndex: 2,
          delay: 2 * 60 * 1000,
          total: 3,
          err
        });
      });
    });
  });
});
