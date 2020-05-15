/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _
} = Cypress;
const {
  Promise
} = Cypress;

const xhrGet = function(win, url) {
  const xhr = new win.XMLHttpRequest;
  xhr.open("GET", url);
  return xhr.send();
};

describe("src/cy/commands/waiting", () => context("#wait", function() {
  describe("number argument", function() {
    it("passes delay onto Promise", function() {
      const delay = cy.spy(Promise, "delay");

      return cy.wait(50).then(() => expect(delay).to.be.calledWith(50, "wait"));
    });

    it("does not change the subject", () => cy
      .wrap({})
      .then(function(subject) {
        return this.subject = subject;}).wait(10).then(function(subject) {
        return expect(subject).to.eq(this.subject);
    }));

    return it("increases timeout by delta", function() {
      const timeout = cy.spy(cy, "timeout");

      return cy
      .wait(50)
      .then(() => expect(timeout).to.be.calledWith(50, true, "wait"));
    });
  });

  describe("function argument", () => describe("errors thrown", () => it("is deprecated", function(done) {
    cy.on("fail", err => {
      expect(err.message).to.eq("`cy.wait(fn)` has been deprecated. Change this command to be `cy.should(fn)`.");
      return done();
    });

    return cy.get("body").wait($body => expect($body).to.match("body"));
  })));

  describe("alias argument", function() {
    before(() => cy.visit("/fixtures/jquery.html"));

    it("waits for a route alias to have a response", function() {
      const response = {foo: "foo"};

      return cy
        .server()
        .route("GET", /.*/, response).as("fetch")
        .window().then(function(win) {
          win.$.get("/foo");
          return null;}).wait("@fetch").then(xhr => expect(xhr.responseBody).to.deep.eq(response));
    });

    it("waits for the route alias to have a request", function() {
      cy.on("command:retry", _.once(() => {
        const win = cy.state("window");
        win.$.get("/users");
        return null;
      })
      );

      return cy
        .server({delay: 1000})
        .route(/users/, {}).as("getUsers")
        .wait("@getUsers.request").then(function(xhr) {
          expect(xhr.url).to.include("/users");
          return expect(xhr.response).to.be.null;
      });
    });

    it("passes timeout option down to requestTimeout of wait", function(done) {
      const retry = _.after(3, _.once(() => {
        return cy.state("window").$.get("/foo");
      })
      );

      cy.on("command:retry", function(options) {
        expect(options.timeout).to.eq(900);
        return done();
      });

      return cy
        .server()
        .route("GET", /.*/, {}).as("fetch")
        .wait("@fetch", {timeout: 900});
    });

    it("resets the timeout after waiting", function() {
      const prevTimeout = cy.timeout();

      const retry = _.after(3, _.once(() => {
        return cy.state("window").$.get("/foo");
      })
      );

      cy.on("command:retry", retry);

      return cy
        .server()
        .route("GET", /.*/, {}).as("fetch")
        .wait("@fetch").then(() => expect(cy.timeout()).to.eq(prevTimeout));
    });

    it("waits for requestTimeout", function(done) {
      Cypress.config("requestTimeout", 199);

      cy.on("command:retry", function(options) {
        expect(options.timeout).to.eq(199);
        return done();
      });

      return cy
        .server()
        .route("GET", "*", {}).as("fetch")
        .wait("@fetch").then(() => expect(cy.timeout()).to.eq(199));
    });

    it("waits for requestTimeout override", function(done) {
      cy.on("command:retry", function(options) {
        expect(options.type).to.eq("request");
        expect(options.timeout).to.eq(199);
        return done();
      });

      return cy
        .server()
        .route("GET", "*", {}).as("fetch")
        .wait("@fetch", {requestTimeout: 199});
    });

    it("waits for responseTimeout", function(done) {
      Cypress.config("responseTimeout", 299);

      cy.on("command:retry", function(options) {
        expect(options.timeout).to.eq(299);
        return done();
      });

      return cy
        .server({delay: 100})
        .route("GET", "*", {}).as("fetch")
        .window().then(function(win) {
          win.$.get("/foo");
          return null;}).wait("@fetch");
    });

    it("waits for responseTimeout override", function(done) {
      cy.on("command:retry", function(options) {
        expect(options.type).to.eq("response");
        expect(options.timeout).to.eq(299);
        return done();
      });

      return cy
        .server({delay: 100})
        .route("GET", "*", {}).as("fetch")
        .window().then(function(win) {
          win.$.get("/foo");
          return null;}).wait("@fetch", {responseTimeout: 299});
    });

    it("waits for requestTimeout and responseTimeout override", function(done) {
      let retryCount = 0;
      cy.on("command:retry", function(options) {
        retryCount++;
        if (retryCount === 1) {
          expect(options.type).to.eq("request");
          expect(options.timeout).to.eq(100);

          //# trigger request to move onto response timeout verification
          const win = cy.state("window");
          return win.$.get("/foo");
        } else if (retryCount === 2) {
          expect(options.type).to.eq("response");
          expect(options.timeout).to.eq(299);
          return done();
        }
      });

      return cy
        .server({delay: 100})
        .route("GET", "*", {}).as("fetch")
        .wait("@fetch", {requestTimeout: 100, responseTimeout: 299});
    });

    //# https://github.com/cypress-io/cypress/issues/369
    it("does not mutate 2nd route methods when using shorthand route", () => cy
      .server()
      .route("POST", /foo/, {}).as("getFoo")
      .route(/bar/, {}).as("getBar")
      .window().then(function(win) {
        win.$.post("/foo");
        win.$.get("/bar");
        return null;}).wait("@getBar"));

    return describe("errors", function() {
      beforeEach(() => Cypress.config("defaultCommandTimeout", 50));

      it("throws when alias doesnt match a route", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` only accepts aliases for routes.\nThe alias: `b` did not match a route.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/wait");
          return done();
        });

        return cy.get("body").as("b").wait("@b");
      });

      it("throws when route is never resolved", function(done) {
        Cypress.config("requestTimeout", 100);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `fetch`. No request ever occurred.");
          return done();
        });

        cy.server();
        cy.route("GET", /.*/, {}).as("fetch");
        return cy.wait("@fetch");
      });

      it("throws when alias is never requested", function(done) {
        Cypress.config("requestTimeout", 100);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `foo`. No request ever occurred.");
          return done();
        });

        return cy
          .server()
          .route(/foo/, {}).as("foo")
          .wait("@foo.request");
      });

      it("throws when alias is missing '@' but matches an available alias", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("Invalid alias: `getAny`.\nYou forgot the `@`. It should be written as: `@getAny`.");
          return done();
        });

        return cy
          .server()
          .route("*", {}).as("getAny")
          .wait("getAny").then(function() {});
      });

      it("throws when 2nd alias doesnt match any registered alias", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("`cy.wait()` could not find a registered alias for: `@bar`.\nAvailable aliases are: `foo`.");
          return done();
        });

        return cy
          .server()
          .route(/foo/, {}).as("foo")
          .window().then(function(win) {
            win.$.get("/foo");
            return null;}).wait(["@foo", "@bar"]);
      });

      it("throws when 2nd alias is missing '@' but matches an available alias", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("Invalid alias: `bar`.\nYou forgot the `@`. It should be written as: `@bar`.");
          return done();
        });

        return cy
          .server()
          .route(/foo/, {}).as("foo")
          .route(/bar/, {}).as("bar")
          .window().then(function(win) {
            win.$.get("/foo");
            return null;}).wait(["@foo", "bar"]);
      });

      it("throws when 2nd alias isnt a route alias", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` only accepts aliases for routes.\nThe alias: `bar` did not match a route.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/wait");
          return done();
        });

        return cy
          .server()
          .route(/foo/, {}).as("foo")
          .get("body").as("bar")
          .window().then(function(win) {
            win.$.get("/foo");
            return null;}).wait(["@foo", "@bar"]);
      });

      it("throws whenever an alias times out", function(done) {
        Cypress.config("requestTimeout", 1000);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `1000ms` for the 1st request to the route: `foo`. No request ever occurred.");
          return done();
        });

        cy.on("command:retry", function(options) {
          //# force foo to time out before bar
          if (/foo/.test(options.error)) {
            return options._runnableTimeout = 0;
          }
        });

        return cy
          .server()
          .route(/foo/, {}).as("foo")
          .route(/bar/, {}).as("bar")
          .wait(["@foo", "@bar"]);
      });

      it("throws when bar cannot resolve", function(done) {
        Cypress.config("requestTimeout", 100);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `bar`. No request ever occurred.");
          return done();
        });

        cy.on("command:retry", _.once(() => {
          const win = cy.state("window");
          win.$.get("/foo");
          return null;
        })
        );

        return cy
          .server()
          .route(/foo/, {foo: "foo"}).as("foo")
          .route(/bar/, {bar: "bar"}).as("bar")
          .wait(["@foo", "@bar"]);
      });

      it("throws when foo cannot resolve", function(done) {
        Cypress.config("requestTimeout", 100);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `foo`. No request ever occurred.");
          return done();
        });

        cy.on("command:retry", _.once(() => {
          const win = cy.state("window");
          win.$.get("/bar");
          return null;
        })
        );

        return cy
          .server()
          .route(/foo/, {foo: "foo"}).as("foo")
          .route(/bar/, {bar: "bar"}).as("bar")
          .wait(["@foo", "@bar"]);
      });

      it("does not throw another timeout error when 2nd alias is missing @", function(done) {
        Promise.onPossiblyUnhandledRejection(done);

        Cypress.config("requestTimeout", 100);

        cy.on("fail", function(err) {
          expect(err.message).to.eq("Invalid alias: `bar`.\nYou forgot the `@`. It should be written as: `@bar`.");
          return done();
        });

        return cy
          .server()
          .route(/foo/, {}).as("foo")
          .route(/bar/, {}).as("bar")
          .wait(["@foo", "bar"]);
      });

      it("does not throw again when 2nd alias doesnt reference a route", function(done) {
        Promise.onPossiblyUnhandledRejection(done);

        Cypress.config("requestTimeout", 100);

        cy.on("fail", function(err) {
          expect(err.message).to.eq("`cy.wait()` only accepts aliases for routes.\nThe alias: `bar` did not match a route.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/wait");
          return done();
        });

        return cy
          .server()
          .route(/foo/, {}).as("foo")
          .get("body").as("bar")
          .wait(["@foo", "@bar"]);
      });

      it("does not retry after 1 alias times out", function(done) {
        Promise.onPossiblyUnhandledRejection(done);

        Cypress.config("requestTimeout", 1000);

        cy.on("command:retry", function(options) {
          //# force bar to time out before foo
          if (/bar/.test(options.error)) {
            return options._runnableTimeout = 0;
          }
        });

        cy.on("fail", err => {
          return done();
        });

        return cy
          .server()
          .route(/foo/, {foo: "foo"}).as("foo")
          .route(/bar/, {bar: "bar"}).as("bar")
          .wait(["@foo", "@bar"]);
      });

      it("throws waiting for the 3rd response", function(done) {
        const resp = {foo: "foo"};
        let response = 0;

        Cypress.config("requestTimeout", 200);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `200ms` for the 3rd request to the route: `get.users`. No request ever occurred.");
          return done();
        });

        cy.on("command:retry", () => {
          response += 1;

          //# dont send the 3rd response
          if (response === 3) { return cy.removeAllListeners("command:retry"); }
          const win = cy.state("window");
          return win.$.get("/users", {num: response});
        });

        cy.server();
        cy.route(/users/, resp).as("get.users");
        return cy.wait(["@get.users", "@get.users", "@get.users"]);
      });

      it("throws waiting for the 2nd response", function(done) {
        const resp = {foo: "foo"};
        let response = 0;

        Cypress.config("requestTimeout", 200);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred.");
          return done();
        });

        //# dont send the 2nd response
        cy.on("command:retry", _.once(() => {
          response += 1;
          const win = cy.state("window");
          return win.$.get("/users", {num: response});
        })
        );

        return cy
          .server()
          .route(/users/, resp).as("getUsers")
          .wait("@getUsers")
          .wait("@getUsers");
      });

      it("throws waiting for the 2nd request", function(done) {
        const resp = {foo: "foo"};
        let request = 0;

        Cypress.config("requestTimeout", 200);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred.");
          return done();
        });

        //# dont send the 2nd request
        cy.on("command:retry", _.once(() => {
          request += 1;
          const win = cy.state("window");
          return win.$.get("/users", {num: request});
        })
        );

        return cy
          .server()
          .route(/users/, resp).as("getUsers")
          .wait("@getUsers.request")
          .wait("@getUsers.request");
      });

      it("throws when waiting for response to route", function(done) {
        Cypress.config("responseTimeout", 100);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `100ms` for the 1st response to the route: `response`. No response ever occurred.");
          return done();
        });

        return cy
          .server()
          .route("*").as("response")
          .window().then(function(win) {
            win.$.get("/timeout?ms=500");
            return null;}).wait("@response");
      });

      it("throws when waiting for 2nd response to route", function(done) {
        Cypress.config("responseTimeout", 200);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `200ms` for the 2nd response to the route: `response`. No response ever occurred.");
          return done();
        });

        return cy
          .server()
          .route("*").as("response")
          .window().then(function(win) {
            win.$.get("/timeout?ms=0");
            win.$.get("/timeout?ms=5000");
            return null;}).wait(["@response", "@response"]);
      });

      it("throws when waiting for 1st response to bar", function(done) {
        Cypress.config("responseTimeout", 200);

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `200ms` for the 1st response to the route: `bar`. No response ever occurred.");
          return done();
        });

        return cy
          .server()
          .route("/timeout?ms=0").as("foo")
          .route("/timeout?ms=5000").as("bar")
          .window().then(function(win) {
            win.$.get("/timeout?ms=0");
            win.$.get("/timeout?ms=5000");
            return null;}).wait(["@foo", "@bar"]);
      });

      it("throws when waiting on the 2nd request", function(done) {
        Cypress.config("requestTimeout", 200);

        cy.on("command:retry", _.once(() => {
          const win = cy.state("window");
          win.$.get("/users");
          return null;
        })
        );

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred.");
          return done();
        });

        return cy
          .server({delay: 200})
          .route(/users/, {}).as("getUsers")
          .wait("@getUsers.request").then(function(xhr) {
            expect(xhr.url).to.include("/users");
            return expect(xhr.response).to.be.null;}).wait("@getUsers");
      });

      it("throws when waiting on the 3rd request on array of aliases", function(done) {
        Cypress.config("requestTimeout", 500);
        Cypress.config("responseTimeout", 10000);

        cy.on("command:retry", _.once(() => {
          const win = cy.state("window");
          _.defer(() => win.$.get("/timeout?ms=2001"));
          return _.defer(() => win.$.get("/timeout?ms=2002"));
        })
        );

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `500ms` for the 1st request to the route: `get.three`. No request ever occurred.");
          return done();
        });

        cy.server();
        cy.route("/timeout?ms=2001").as("getOne");
        cy.route("/timeout?ms=2002").as("getTwo");
        cy.route(/three/, {}).as("get.three");
        return cy.wait(["@getOne", "@getTwo", "@get.three"]);
      });

      it("throws when waiting on the 3rd response on array of aliases", function(done) {
        Cypress.config("requestTimeout", 200);
        Cypress.config("responseTimeout", 1000);

        const win = cy.state("window");

        cy.on("command:retry", function(options) {
          if (/getThree/.test(options.error)) {
            //# force 3 to immediately time out
            return options._runnableTimeout = 0;
          }
        });

        cy.on("fail", function(err) {
          expect(err.message).to.include("`cy.wait()` timed out waiting `1000ms` for the 1st response to the route: `getThree`. No response ever occurred.");
          return done();
        });

        return cy
          .server()
          .route("/timeout?ms=1").as("getOne")
          .route("/timeout?ms=2").as("getTwo")
          .route("/timeout?ms=3000").as("getThree")
          .then(function() {
            win.$.get("/timeout?ms=1");
            win.$.get("/timeout?ms=2");
            win.$.get("/timeout?ms=3000");

            return null;}).wait(["@getOne", "@getTwo", "@getThree"]);
      });

      return it("throws when passed multiple string arguments", function(done) {
        cy.on("fail", function(err) {
          expect(err.message).to.eq("`cy.wait()` was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array.");
          expect(err.docsUrl).to.eq("https://on.cypress.io/wait");
          return done();
        });

        return cy.wait("@foo", "@bar");
      });
    });
  });

  describe("multiple alias arguments", function() {
    before(() => cy.visit("/fixtures/jquery.html"));

    return it("can wait for all requests to have a response", function() {
      const resp1 = {foo: "foo"};
      const resp2 = {bar: "bar"};

      cy.server();
      cy.route(/users/, resp1).as("getUsers");
      cy.route(/posts/, resp2).as("get.posts");
      cy.window().then(function(win) {
        win.$.get("/users");
        win.$.get("/posts");
        return null;
      });
      return cy.wait(["@getUsers", "@get.posts"]).spread(function(xhr1, xhr2) {
        expect(xhr1.responseBody).to.deep.eq(resp1);
        return expect(xhr2.responseBody).to.deep.eq(resp2);
      });
    });
  });

  describe("multiple separate alias waits", function() {
    before(() => cy.visit("/fixtures/jquery.html"));

    it("waits for a 3rd request before resolving", function() {
      const resp = {foo: "foo"};
      let response = 0;

      const win = cy.state("window");

      cy.on("command:retry", function(options) {
        if (options._retries === 1) {
          response += 1;
          return win.$.get("/users", {num: response});
        }
      });

      return cy
        .server()
        .route(/users/, resp).as("getUsers")
        .wait("@getUsers").then(function(xhr) {
          expect(xhr.url).to.include("/users?num=1");
          return expect(xhr.responseBody).to.deep.eq(resp);}).wait("@getUsers").then(function(xhr) {
          expect(xhr.url).to.include("/users?num=2");
          return expect(xhr.responseBody).to.deep.eq(resp);}).wait("@getUsers").then(function(xhr) {
          expect(xhr.url).to.include("/users?num=3");
          return expect(xhr.responseBody).to.deep.eq(resp);
      });
    });

    //# FIXME: failing in CI sometimes https://circleci.com/gh/cypress-io/cypress/5655
    it.skip("waits for the 4th request before resolving", function() {
      const resp = {foo: "foo"};
      let response = 0;

      const win = cy.state("window");

      cy.on("command:retry", function(options) {
        //# only add a request for the first unique retry
        //# for each request
        if (options._retries === 1) {
          response += 1;
          return win.$.get("/users", {num: response});
        }
      });

      return cy
        .server()
        .route(/users/, resp).as("getUsers")
        .wait(["@getUsers", "@getUsers", "@getUsers"]).spread(function(xhr1, xhr2, xhr3) {
          expect(xhr1.url).to.include("/users?num=1");
          expect(xhr2.url).to.include("/users?num=2");
          return expect(xhr3.url).to.include("/users?num=3");}).wait("@getUsers").then(function(xhr) {
          expect(xhr.url).to.include("/users?num=4");
          return expect(xhr.responseBody).to.deep.eq(resp);
      });
    });
    return null;
  });

  describe("errors", () => describe("invalid 1st argument", function() {
    beforeEach(() => Cypress.config("defaultCommandTimeout", 50));

    return _.each([
        { type: 'NaN', val: 0/0, errVal: 'NaN' },
        { type: 'Infinity', val: Infinity, errVal: 'Infinity' },
        { type: 'Array', val: [] },
        { type: 'null', val: null },
        { type: 'undefined', val: undefined },
        { type: 'Boolean', val: true },
        { type: 'Object', val: {} },
        { type: 'Symbol', val: Symbol.iterator, errVal: "Symbol(Symbol.iterator)" }
      ], attrs => {
      return it(`throws when 1st arg is ${attrs.type}`, done => {
        cy.on("fail", err => {
          expect(err.message).to.eq(`\`cy.wait()\` only accepts a number, an alias of a route, or an array of aliases of routes. You passed: \`${attrs.errVal || JSON.stringify(attrs.val)}\``);
          expect(err.docsUrl).to.eq("https://on.cypress.io/wait");
          return done();
        });
        return cy.get("body").wait(attrs.val);
      });
    });
  }));

  return describe(".log", function() {
    beforeEach(function() {
      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        this.lastLog = log;
        return this.logs.push(log);
      });

      return null;
    });

    it("can turn off logging", () => cy.wait(10, {log: false}).then(function() {
      const {
        lastLog
      } = this;

      return expect(lastLog).to.be.undefined;
    }));

    describe("number argument", function() {
      it("does not immediately end", function() {
        cy.on("log:added", function(attrs, log) {
          if (attrs.name === "wait") {
            return expect(log.get("state")).not.to.eq("passed");
          }
        });

        return cy.noop({}).wait(10).then(function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("state")).to.eq("passed");
        });
      });

      it("does not immediately snapshot", function() {
        cy.on("log:added", function(attrs, log) {
          if (attrs.name === "wait") {
            return expect(log.get("snapshots")).not.to.be.ok;
          }
        });

        return cy.noop({}).wait(10).then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("snapshots").length).to.eq(1);
          return expect(lastLog.get("snapshots")[0]).to.be.an("object");
        });
      });

      it("is a type: child if subject", () => cy.noop({}).wait(10).then(function() {
        const {
          lastLog
        } = this;

        return expect(lastLog.get("type")).to.eq("child");
      }));

      it("is a type: child if subject is false", function() {
        cy.noop(false).wait(10).then(function() {
          const {
            lastLog
          } = this;

          expect(lastLog.get("type")).to.eq("child");

          return it("is a type: parent if subject is null or undefined", function() {});
        });
        return cy.wait(10).then(function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("type")).to.eq("parent");
        });
      });

      it("#consoleProps", () => cy.wait(10).then(function() {
        return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "wait",
          "Waited For": "10ms before continuing",
          "Yielded": undefined
        });}));

      return it("#consoleProps as a child", () => cy.wrap({}).wait(10).then(function() {
        return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "wait",
          "Waited For": "10ms before continuing",
          "Yielded": {}
        });}));
  });

    describe("alias argument errors", function() {
      it(".log", function(done) {
        Cypress.config("requestTimeout", 100);

        let numRetries = 0;

        cy.on("fail", err => {
          const obj = {
            name: "wait",
            referencesAlias: [{name: 'getFoo', cardinal: 1, ordinal: "1st"}],
            aliasType: "route",
            type: "parent",
            error: err,
            instrument: "command",
            message: "@getFoo"
            // numRetries: numRetries + 1
          };

          const {
            lastLog
          } = this;

          _.each(obj, (value, key) => {
            return expect(lastLog.get(key)).deep.eq(value, `expected key: ${key} to eq value: ${value}`);
          });

          return done();
        });

        cy.on("command:retry", () => numRetries += 1);

        cy.server();
        cy.route(/foo/, {}).as("getFoo");
        return cy.noop({}).wait("@getFoo");
      });

      it("only logs once", function(done) {
        cy.on("fail", err => {
          expect(this.logs.length).to.eq(1);
          expect(err.message).to.eq("`cy.wait()` could not find a registered alias for: `@foo`.\nYou have not aliased anything yet.");
          return done();
        });

        return cy.wait("@foo");
      });

      return it("#consoleProps multiple aliases", function(done) {
        Cypress.config("requestTimeout", 100);

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(lastLog.get("error")).to.eq(err);
          expect(err.message).to.include("`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `getBar`. No request ever occurred.");
          return done();
        });

        return cy
          .server()
          .route(/foo/, {}).as("getFoo")
          .route(/bar/, {}).as("getBar")
          .window().then(function(win) {
            xhrGet(win, "/foo");
            return null;}).wait(["@getFoo", "@getBar"]);
      });
    });

    describe("function argument errors", function() {
      it(".log");

      return it("#consoleProps");
    });

    return describe("alias argument", function() {
      it("is a parent command", () => cy
        .server()
        .route(/foo/, {}).as("getFoo")
        .window().then(function(win) {
          xhrGet(win, "/foo");
          return null;}).wait("@getFoo").then(function() {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("type")).to.eq("parent");
      }));

      it("passes as array of referencesAlias", () => cy
        .server()
        .route(/foo/, {}).as("getFoo")
        .route(/bar/, {}).as("getBar")
        .window().then(function(win) {
          xhrGet(win, "/foo");
          xhrGet(win, "/bar");
          xhrGet(win, "/foo");
          return null;}).wait(["@getFoo", "@getBar", "@getFoo"]).then(function(xhrs) {
          const {
            lastLog
          } = this;

          return expect(lastLog.get("referencesAlias")).to.deep.eq([
            {
              name: "getFoo",
              cardinal: 1,
              ordinal: '1st'
            },
            {
              name: "getBar",
              cardinal: 1,
              ordinal: '1st'
            },
            {
              name: "getFoo",
              cardinal: 2,
              ordinal: '2nd'
            }
          ]);}));

      it("#consoleProps waiting on 1 alias", () => cy
        .server()
        .route(/foo/, {}).as("getFoo")
        .window().then(function(win) {
          xhrGet(win, "/foo");
          return null;}).wait("@getFoo").then(function(xhr) {
          return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
            Command: "wait",
            "Waited For": "getFoo",
            Yielded: xhr
          });}));

      return it("#consoleProps waiting on multiple aliases", () => cy
        .server()
        .route(/foo/, {}).as("getFoo")
        .route(/bar/, {}).as("getBar")
        .window().then(function(win) {
          xhrGet(win, "/foo");
          xhrGet(win, "/bar");
          return null;}).wait(["@getFoo", "@getBar"]).then(function(xhrs) {
          return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
            Command: "wait",
            "Waited For": "getFoo, getBar",
            Yielded: [xhrs[0], xhrs[1]] //# explictly create the array here
          });}));
  });
});
}));

      // describe "function argument", ->
      //   it "#consoleProps", ->
      //     retriedThreeTimes = false

      //     retry = _.after 3, ->
      //       retriedThreeTimes = true

      //     cy.on "command:retry", retry

      //     fn = ->
      //       expect(retriedThreeTimes).to.be.true;

      //     cy
      //       .wait(fn).then ->
      //         expect(@lastLog.invoke("consoleProps")).to.deep.eq {
      //           Command: "wait"
      //           "Waited For": _.str.clean(fn.toString())
      //           Retried: "3 times"
      //         }
