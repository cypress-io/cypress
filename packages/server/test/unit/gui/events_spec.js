/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../../spec_helper");

const _        = require("lodash");
const EE       = require("events");
const extension = require("@packages/extension");
const electron = require("electron");
const Promise  = require("bluebird");
const debug    = require("debug")("test");
const chromePolicyCheck = require(`${root}../lib/util/chrome_policy_check`);
const cache    = require(`${root}../lib/cache`);
const logger   = require(`${root}../lib/logger`);
const Project  = require(`${root}../lib/project`);
const Updater  = require(`${root}../lib/updater`);
const user     = require(`${root}../lib/user`);
const errors   = require(`${root}../lib/errors`);
const browsers = require(`${root}../lib/browsers`);
const openProject = require(`${root}../lib/open_project`);
const open     = require(`${root}../lib/util/open`);
const auth     = require(`${root}../lib/gui/auth`);
const logs     = require(`${root}../lib/gui/logs`);
const events   = require(`${root}../lib/gui/events`);
const dialog   = require(`${root}../lib/gui/dialog`);
const Windows  = require(`${root}../lib/gui/windows`);
const ensureUrl = require(`${root}../lib/util/ensure-url`);
const konfig   = require(`${root}../lib/konfig`);

describe("lib/gui/events", function() {
  beforeEach(function() {
    this.send    = sinon.stub();
    this.options = {};
    this.cookies = sinon.stub({
      get() {},
      set() {},
      remove() {}
    });
    this.event   = {
      sender: {
        send: this.send,
        session: {
          cookies: this.cookies
        }
      }
    };
    this.bus = new EE();

    sinon.stub(electron.ipcMain, "on");
    sinon.stub(electron.ipcMain, "removeAllListeners");

    return this.handleEvent = (type, arg) => {
      const id = `${type}-${Math.random()}`;
      return Promise
      .try(() => {
        return events.handleEvent(this.options, this.bus, this.event, id, type, arg);
    }).return({
        sendCalledWith: data => {
          return expect(this.send).to.be.calledWith("response", {id, data});
        },
        sendErrCalledWith: err => {
          return expect(this.send).to.be.calledWith("response", {id, __error: errors.clone(err, {html: true})});
        }
      });
    };
  });

  context(".stop", () => it("calls ipc#removeAllListeners", function() {
    events.stop();
    return expect(electron.ipcMain.removeAllListeners).to.be.calledOnce;
  }));

  context(".start", function() {
    it("ipc attaches callback on request", function() {
      const handleEvent = sinon.stub(events, "handleEvent");
      events.start({foo: "bar"});
      return expect(electron.ipcMain.on).to.be.calledWith("request");
    });

    return it("partials in options in request callback", function() {
      electron.ipcMain.on.yields("arg1", "arg2");
      const handleEvent = sinon.stub(events, "handleEvent");

      events.start({foo: "bar"}, {});
      return expect(handleEvent).to.be.calledWith({foo: "bar"}, {}, "arg1", "arg2");
    });
  });

  context("no ipc event", () => it("throws", function() {
    return this.handleEvent("no:such:event").catch(err => expect(err.message).to.include("No ipc event registered for: 'no:such:event'"));
  }));

  context("dialog", () => describe("show:directory:dialog", function() {
    it("calls dialog.show and returns", function() {
      sinon.stub(dialog, "show").resolves({foo: "bar"});
      return this.handleEvent("show:directory:dialog").then(assert => {
        return assert.sendCalledWith({foo: "bar"});
      });
    });

    return it("catches errors", function() {
      const err = new Error("foo");
      sinon.stub(dialog, "show").rejects(err);

      return this.handleEvent("show:directory:dialog").then(assert => {
        return assert.sendErrCalledWith(err);
      });
    });
  }));

  context("user", function() {
    describe("begin:auth", function() {
      it("calls auth.start and returns user", function() {
        sinon.stub(auth, "start").resolves({foo: "bar"});
        return this.handleEvent("begin:auth").then(assert => {
          return assert.sendCalledWith({foo: "bar"});
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(auth, "start").rejects(err);

        return this.handleEvent("begin:auth").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("log:out", function() {
      it("calls user.logOut and returns user", function() {
        sinon.stub(user, "logOut").resolves({foo: "bar"});
        return this.handleEvent("log:out").then(assert => {
          return assert.sendCalledWith({foo: "bar"});
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(user, "logOut").rejects(err);

        return this.handleEvent("log:out").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    return describe("get:current:user", function() {
      it("calls user.get and returns user", function() {
        sinon.stub(user, "get").resolves({foo: "bar"});
        return this.handleEvent("get:current:user").then(assert => {
          return assert.sendCalledWith({foo: "bar"});
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(user, "get").rejects(err);

        return this.handleEvent("get:current:user").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });
  });

  context("external shell", () => describe("external:open", () => it("shell.openExternal with arg", function() {
    electron.shell.openExternal = sinon.spy();
    return this.handleEvent("external:open", {foo: "bar"}).then(() => expect(electron.shell.openExternal).to.be.calledWith({foo: "bar"}));
  })));

  context("window", function() {
    describe("window:open", function() {
      beforeEach(function() {
        this.options.projectRoot = "/path/to/my/project";

        this.win = sinon.stub({
          on() {},
          once() {},
          loadURL() {},
          webContents: {}
        });

        return sinon.stub(Windows, "create").withArgs(this.options.projectRoot).returns(this.win);
      });

      it("calls Windows#open with args and resolves with return of Windows.open", function() {
        return this.handleEvent("window:open", {type: "INDEX"})
        .then(assert => {
          return assert.sendCalledWith(events.nullifyUnserializableValues(this.win));
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(Windows, "open").withArgs(this.options.projectRoot, {foo: "bar"}).rejects(err);

        return this.handleEvent("window:open", {foo: "bar"}).then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    return describe("window:close", () => it("calls destroy on Windows#getByWebContents", function() {
      this.destroy = sinon.stub();
      sinon.stub(Windows, "getByWebContents").withArgs(this.event.sender).returns({destroy: this.destroy});
      this.handleEvent("window:close");
      return expect(this.destroy).to.be.calledOnce;
    }));
  });

  context("updating", () => describe("updater:check", function() {
    it("returns version when new version", function() {
      sinon.stub(Updater, "check").yieldsTo("onNewVersion", {version: "1.2.3"});
      return this.handleEvent("updater:check").then(assert => assert.sendCalledWith("1.2.3"));
    });

    return it("returns false when no new version", function() {
      sinon.stub(Updater, "check").yieldsTo("onNoNewVersion");
      return this.handleEvent("updater:check").then(assert => assert.sendCalledWith(false));
    });
  }));

  context("log events", function() {
    describe("get:logs", function() {
      it("returns array of logs", function() {
        sinon.stub(logger, "getLogs").resolves([]);

        return this.handleEvent("get:logs").then(assert => {
          return assert.sendCalledWith([]);
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(logger, "getLogs").rejects(err);

        return this.handleEvent("get:logs").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("clear:logs", function() {
      it("returns null", function() {
        sinon.stub(logger, "clearLogs").resolves();

        return this.handleEvent("clear:logs").then(assert => {
          return assert.sendCalledWith(null);
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(logger, "clearLogs").rejects(err);

        return this.handleEvent("clear:logs").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("on:log", () => it("sets send to onLog", function() {
      const onLog = sinon.stub(logger, "onLog");
      this.handleEvent("on:log");
      expect(onLog).to.be.called;
      return expect(onLog.getCall(0).args[0]).to.be.a("function");
    }));

    return describe("off:log", () => it("calls logger#off and returns null", function() {
      sinon.stub(logger, "off");
      return this.handleEvent("off:log").then(function(assert) {
        expect(logger.off).to.be.calledOnce;
        return assert.sendCalledWith(null);
      });
    }));
  });

  context("gui errors", () => describe("gui:error", function() {
    it("calls logs.error with arg", function() {
      const err = new Error("foo");

      sinon.stub(logs, "error").withArgs(err).resolves();

      return this.handleEvent("gui:error", err).then(assert => {
        return assert.sendCalledWith(null);
      });
    });

    it("calls logger.createException with error", function() {
      const err = new Error("foo");

      sinon.stub(logger, "createException").withArgs(err).resolves();

      return this.handleEvent("gui:error", err).then(assert => {
        expect(logger.createException).to.be.calledOnce;
        return assert.sendCalledWith(null);
      });
    });

    it("swallows logger.createException errors", function() {
      const err = new Error("foo");

      sinon.stub(logger, "createException").withArgs(err).rejects(new Error("err"));

      return this.handleEvent("gui:error", err).then(assert => {
        expect(logger.createException).to.be.calledOnce;
        return assert.sendCalledWith(null);
      });
    });

    return it("catches errors", function() {
      const err = new Error("foo");
      const err2 = new Error("bar");

      sinon.stub(logs, "error").withArgs(err).rejects(err2);

      return this.handleEvent("gui:error", err).then(assert => {
        return assert.sendErrCalledWith(err2);
      });
    });
  }));

  context("user events", function() {
    describe("get:orgs", function() {
      it("returns array of orgs", function() {
        sinon.stub(Project, "getOrgs").resolves([]);

        return this.handleEvent("get:orgs").then(assert => {
          return assert.sendCalledWith([]);
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(Project, "getOrgs").rejects(err);

        return this.handleEvent("get:orgs").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    return describe("open:finder", function() {
      it("opens with open lib", function() {
        sinon.stub(open, "opn").resolves("okay");

        return this.handleEvent("open:finder", "path").then(assert => {
          expect(open.opn).to.be.calledWith("path");
          return assert.sendCalledWith("okay");
        });
      });

      it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(open, "opn").rejects(err);

        return this.handleEvent("open:finder", "path").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });

      return it("works even after project is opened (issue #227)", function() {
        sinon.stub(open, "opn").resolves("okay");
        sinon.stub(Project.prototype, "open").resolves();
        sinon.stub(Project.prototype, "getConfig").resolves({some: "config"});

        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(() => {
          return this.handleEvent("open:finder", "path");
      }).then(assert => {
          expect(open.opn).to.be.calledWith("path");
          return assert.sendCalledWith("okay");
        });
      });
    });
  });

  return context("project events", function() {
    describe("get:projects", function() {
      it("returns array of projects", function() {
        sinon.stub(Project, "getPathsAndIds").resolves([]);

        return this.handleEvent("get:projects").then(assert => {
          return assert.sendCalledWith([]);
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(Project, "getPathsAndIds").rejects(err);

        return this.handleEvent("get:projects").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("get:project:statuses", function() {
      it("returns array of projects with statuses", function() {
        sinon.stub(Project, "getProjectStatuses").resolves([]);

        return this.handleEvent("get:project:statuses").then(assert => {
          return assert.sendCalledWith([]);
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(Project, "getProjectStatuses").rejects(err);

        return this.handleEvent("get:project:statuses").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("get:project:status", function() {
      it("returns project returned by Project.getProjectStatus", function() {
        sinon.stub(Project, "getProjectStatus").resolves("project");

        return this.handleEvent("get:project:status").then(assert => {
          return assert.sendCalledWith("project");
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(Project, "getProjectStatus").rejects(err);

        return this.handleEvent("get:project:status").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("add:project", function() {
      it("adds project + returns result", function() {
        sinon.stub(Project, "add").withArgs("/_test-output/path/to/project", this.options).resolves("result");

        return this.handleEvent("add:project", "/_test-output/path/to/project").then(assert => {
          return assert.sendCalledWith("result");
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(Project, "add").withArgs("/_test-output/path/to/project", this.options).rejects(err);

        return this.handleEvent("add:project", "/_test-output/path/to/project").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("remove:project", function() {
      it("remove project + returns arg", function() {
        sinon.stub(cache, "removeProject").withArgs("/_test-output/path/to/project").resolves();

        return this.handleEvent("remove:project", "/_test-output/path/to/project").then(assert => {
          return assert.sendCalledWith("/_test-output/path/to/project");
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(cache, "removeProject").withArgs("/_test-output/path/to/project").rejects(err);

        return this.handleEvent("remove:project", "/_test-output/path/to/project").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("open:project", function() {
      beforeEach(function() {
        sinon.stub(extension, "setHostAndPath").resolves();
        sinon.stub(browsers, "getAllBrowsersWith");
        browsers.getAllBrowsersWith.resolves([]);
        browsers.getAllBrowsersWith.withArgs("/usr/bin/baz-browser").resolves([{foo: 'bar'}]);
        this.open = sinon.stub(Project.prototype, "open").resolves();
        sinon.stub(Project.prototype, "close").resolves();
        return sinon.stub(Project.prototype, "getConfig").resolves({some: "config"});
      });

      afterEach(() => //# close down 'open' projects
      //# to prevent side effects
      openProject.close());

      it("open project + returns config", function() {
        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(assert => {
          return assert.sendCalledWith({some: "config"});
        });
      });

      it("catches errors", function() {
        const err = new Error("foo");
        this.open.rejects(err);

        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });

      it("sends 'focus:tests' onFocusTests", function() {
        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(() => {
          return this.handleEvent("on:focus:tests");
      }).then(assert => {
          this.open.lastCall.args[0].onFocusTests();
          return assert.sendCalledWith(undefined);
        });
      });

      it("sends 'config:changed' onSettingsChanged", function() {
        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(() => {
          return this.handleEvent("on:config:changed");
      }).then(assert => {
          this.open.lastCall.args[0].onSettingsChanged();
          return assert.sendCalledWith(undefined);
        });
      });

      it("sends 'spec:changed' onSpecChanged", function() {
        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(() => {
          return this.handleEvent("on:spec:changed");
      }).then(assert => {
          this.open.lastCall.args[0].onSpecChanged("/path/to/spec.coffee");
          return assert.sendCalledWith("/path/to/spec.coffee");
        });
      });

      it("sends 'project:warning' onWarning", function() {
        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(() => {
          return this.handleEvent("on:project:warning");
      }).then(assert => {
          this.open.lastCall.args[0].onWarning({name: "foo", message: "foo"});
          return assert.sendCalledWith({name: "foo", message: "foo"});
        });
      });

      it("sends 'project:error' onError", function() {
        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(() => {
          return this.handleEvent("on:project:error");
      }).then(assert => {
          this.open.lastCall.args[0].onError({name: "foo", message: "foo"});
          return assert.sendCalledWith({name: "foo", message: "foo"});
        });
      });

      it("calls browsers.getAllBrowsersWith with no args when no browser specified", function() {
        return this.handleEvent("open:project", "/_test-output/path/to/project").then(() => expect(browsers.getAllBrowsersWith).to.be.calledWith());
      });

      it("calls browsers.getAllBrowsersWith with browser when browser specified", function() {
        sinon.stub(openProject, "create").resolves();
        this.options.browser = "/usr/bin/baz-browser";

        return this.handleEvent("open:project", "/_test-output/path/to/project").then(() => {
          expect(browsers.getAllBrowsersWith).to.be.calledWith(this.options.browser);
          return expect(openProject.create).to.be.calledWithMatch(
            "/_test-output/path/to/project",
            {
              browser: "/usr/bin/baz-browser",
              config: {
                browsers: [
                  {
                    foo: "bar"
                  }
                ]
              }
            }
          );
        });
      });

      return it("attaches warning to Chrome browsers when Chrome policy check fails", function() {
        sinon.stub(openProject, "create").resolves();
        this.options.browser = "/foo";

        browsers.getAllBrowsersWith.withArgs("/foo").resolves([{family: 'chromium'}, {family: 'some other'}]);

        sinon.stub(chromePolicyCheck, "run").callsArgWith(0, new Error);

        return this.handleEvent("open:project", "/_test-output/path/to/project").then(() => {
          expect(browsers.getAllBrowsersWith).to.be.calledWith(this.options.browser);
          return expect(openProject.create).to.be.calledWithMatch(
            "/_test-output/path/to/project",
            {
              browser: "/foo",
              config: {
                browsers: [
                  {
                    family: "chromium",
                    warning: "Cypress detected policy settings on your computer that may cause issues with using this browser. For more information, see https://on.cypress.io/bad-browser-policy"
                  },
                  {
                    family: "some other"
                  }
                ]
              }
            }
          );
        });
      });
    });

    describe("close:project", function() {
      beforeEach(() => sinon.stub(Project.prototype, "close").withArgs({sync: true}).resolves());

      it("is noop and returns null when no project is open", function() {
        expect(openProject.getProject()).to.be.null;

        return this.handleEvent("close:project").then(assert => {
          return assert.sendCalledWith(null);
        });
      });

      return it("closes down open project and returns null", function() {
        sinon.stub(Project.prototype, "getConfig").resolves({});
        sinon.stub(Project.prototype, "open").resolves();

        return this.handleEvent("open:project", "/_test-output/path/to/project")
        .then(() => {
          //# it should store the opened project
          expect(openProject.getProject()).not.to.be.null;

          return this.handleEvent("close:project");
      }).then(assert => {
          //# it should store the opened project
          expect(openProject.getProject()).to.be.null;

          return assert.sendCalledWith(null);
        });
      });
    });

    describe("get:runs", function() {
      it("calls openProject.getRuns", function() {
        sinon.stub(openProject, "getRuns").resolves([]);

        return this.handleEvent("get:runs").then(assert => {
          return expect(openProject.getRuns).to.be.called;
        });
      });

      it("returns array of runs", function() {
        sinon.stub(openProject, "getRuns").resolves([]);

        return this.handleEvent("get:runs").then(assert => {
          return assert.sendCalledWith([]);
        });
      });

      it("sends UNAUTHENTICATED when statusCode is 401", function() {
        const err = new Error("foo");
        err.statusCode = 401;
        sinon.stub(openProject, "getRuns").rejects(err);

        return this.handleEvent("get:runs").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("UNAUTHENTICATED");
        });
      });

      it("sends TIMED_OUT when cause.code is ESOCKETTIMEDOUT", function() {
        const err = new Error("foo");
        err.cause = { code: "ESOCKETTIMEDOUT" };
        sinon.stub(openProject, "getRuns").rejects(err);

        return this.handleEvent("get:runs").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("TIMED_OUT");
        });
      });

      it("sends NO_CONNECTION when code is ENOTFOUND", function() {
        const err = new Error("foo");
        err.code = "ENOTFOUND";
        sinon.stub(openProject, "getRuns").rejects(err);

        return this.handleEvent("get:runs").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("NO_CONNECTION");
        });
      });

      it("sends type when if existing for other errors", function() {
        const err = new Error("foo");
        err.type = "NO_PROJECT_ID";
        sinon.stub(openProject, "getRuns").rejects(err);

        return this.handleEvent("get:runs").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("NO_PROJECT_ID");
        });
      });

      return it("sends UNKNOWN + name,message,stack for other errors", function() {
        const err = new Error("foo");
        err.name = "name";
        err.message = "message";
        err.stack = "stack";
        sinon.stub(openProject, "getRuns").rejects(err);

        return this.handleEvent("get:runs").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("UNKNOWN");
        });
      });
    });

    describe("setup:dashboard:project", function() {
      it("returns result of openProject.createCiProject", function() {
        sinon.stub(openProject, "createCiProject").resolves("response");

        return this.handleEvent("setup:dashboard:project").then(assert => {
          return assert.sendCalledWith("response");
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(openProject, "createCiProject").rejects(err);

        return this.handleEvent("setup:dashboard:project").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("get:record:keys", function() {
      it("returns result of project.getRecordKeys", function() {
        sinon.stub(openProject, "getRecordKeys").resolves(["ci-key-123"]);

        return this.handleEvent("get:record:keys").then(assert => {
          return assert.sendCalledWith(["ci-key-123"]);
        });
      });

      return it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(openProject, "getRecordKeys").rejects(err);

        return this.handleEvent("get:record:keys").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });
    });

    describe("request:access", function() {
      it("returns result of project.requestAccess", function() {
        sinon.stub(openProject, "requestAccess").resolves("response");

        return this.handleEvent("request:access", "org-id-123").then(assert => {
          expect(openProject.requestAccess).to.be.calledWith("org-id-123");
          return assert.sendCalledWith("response");
        });
      });

      it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(openProject, "requestAccess").rejects(err);

        return this.handleEvent("request:access", "org-id-123").then(assert => {
          return assert.sendErrCalledWith(err);
        });
      });

      it("sends ALREADY_MEMBER when statusCode is 403", function() {
        const err = new Error("foo");
        err.statusCode = 403;
        sinon.stub(openProject, "requestAccess").rejects(err);

        return this.handleEvent("request:access", "org-id-123").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("ALREADY_MEMBER");
        });
      });

      it("sends ALREADY_REQUESTED when statusCode is 429 with certain error", function() {
        const err = new Error("foo");
        err.statusCode = 422;
        err.errors = {
          userId: [ "This User has an existing MembershipRequest to this Organization." ]
        };

        sinon.stub(openProject, "requestAccess").rejects(err);

        return this.handleEvent("request:access", "org-id-123").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("ALREADY_REQUESTED");
        });
      });

      it("sends type when if existing for other errors", function() {
        const err = new Error("foo");
        err.type = "SOME_TYPE";
        sinon.stub(openProject, "requestAccess").rejects(err);

        return this.handleEvent("request:access", "org-id-123").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("SOME_TYPE");
        });
      });

      return it("sends UNKNOWN for other errors", function() {
        const err = new Error("foo");
        sinon.stub(openProject, "requestAccess").rejects(err);

        return this.handleEvent("request:access", "org-id-123").then(assert => {
          expect(this.send).to.be.calledWith("response");
          return expect(this.send.firstCall.args[1].__error.type).to.equal("UNKNOWN");
        });
      });
    });

    describe("ping:api:server", function() {
      it("returns ensures url", function() {
        sinon.stub(ensureUrl, "isListening").resolves();

        return this.handleEvent("ping:api:server").then(assert => {
          expect(ensureUrl.isListening).to.be.calledWith(konfig("api_url"));
          return assert.sendCalledWith();
        });
      });

      it("catches errors", function() {
        const err = new Error("foo");
        sinon.stub(ensureUrl, "isListening").rejects(err);

        return this.handleEvent("ping:api:server").then(assert => {
          assert.sendErrCalledWith(err);
          return expect(err.apiUrl).to.equal(konfig("api_url"));
        });
      });

      return it("sends first of aggregate error", function() {
        const err = new Error("AggregateError");
        err.message = "aggregate error";
        err[0] = {
          code: "ECONNREFUSED",
          port: 1234,
          address: "127.0.0.1"
        };
        err.length = 1;
        sinon.stub(ensureUrl, "isListening").rejects(err);

        return this.handleEvent("ping:api:server").then(assert => {
          assert.sendErrCalledWith(err);
          expect(err.name).to.equal("ECONNREFUSED 127.0.0.1:1234");
          expect(err.message).to.equal("ECONNREFUSED 127.0.0.1:1234");
          return expect(err.apiUrl).to.equal(konfig("api_url"));
        });
      });
    });

    return describe("launch:browser", function() {
      it("launches browser via openProject", function() {
        sinon.stub(openProject, 'launch').callsFake(function(browser, spec, opts) {
          debug("spec was %o", spec);
          expect(browser, "browser").to.eq('foo');
          expect(spec, "spec").to.deep.equal({
            name: "bar",
            absolute: "/path/to/bar",
            relative: "to/bar",
            specType: "integration"
          });

          opts.onBrowserOpen();
          opts.onBrowserClose();

          return Promise.resolve();
        });

        const spec = {
          name: "bar",
          absolute: "/path/to/bar",
          relative: "to/bar"
        };
        const arg = {
          browser: 'foo',
          spec,
          specType: 'integration'
        };
        return this.handleEvent("launch:browser", arg).then(() => {
          expect(this.send.getCall(0).args[1].data).to.include({ browserOpened: true });
          return expect(this.send.getCall(1).args[1].data).to.include({ browserClosed: true });
        });
      });

      return it("wraps error titles if not set", function() {
        const err = new Error('foo');
        sinon.stub(openProject, 'launch').rejects(err);

        return this.handleEvent("launch:browser", {}).then(() => {
          return expect(this.send.getCall(0).args[1].__error).to.include({ message: 'foo', title: 'Error launching browser' });
        });
      });
    });
  });
});
