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
const RESPONSE_TIMEOUT = 22222;

describe("src/cy/commands/request", () => context("#request", function() {
  beforeEach(function() {
    cy.stub(Cypress, "backend").callThrough();
    return Cypress.config("responseTimeout", RESPONSE_TIMEOUT);
  });

  describe("argument signature", function() {
    beforeEach(function() {
      const backend = Cypress.backend
      .withArgs("http:request")
      .resolves({ isOkStatusCode: true, status: 200 });

      return this.expectOptionsToBe = function(opts) {
        _.defaults(opts, {
          failOnStatusCode: true,
          retryOnNetworkFailure: true,
          retryOnStatusCodeFailure: false,
          gzip: true,
          followRedirect: true,
          timeout: RESPONSE_TIMEOUT,
          method: "GET"
        });

        const options = backend.firstCall.args[1];

        _.each(options, (value, key) => expect(options[key]).to.deep.eq(opts[key], `failed on property: (${key})`));
        return _.each(opts, (value, key) => expect(opts[key]).to.deep.eq(options[key], `failed on property: (${key})`));
      };
    });

    it("accepts object with url", () => cy.request({url: "http://localhost:8000/foo"}).then(function() {
      return this.expectOptionsToBe({
        url: "http://localhost:8000/foo"
      });
    }));

    it("accepts object with url, method, headers, body", () => cy.request({
      url: "http://github.com/users",
      method: "POST",
      body: {name: "brian"},
      headers: {
        "x-token": "abc123"
      }
    }).then(function() {
      return this.expectOptionsToBe({
        url: "http://github.com/users",
        method: "POST",
        json: true,
        body: {name: "brian"},
        headers: {
          "x-token": "abc123"
        }
      });
    }));

    it("accepts object with url + timeout", () => cy.request({url: "http://localhost:8000/foo", timeout: 23456}).then(function() {
      return this.expectOptionsToBe({
        url: "http://localhost:8000/foo",
        timeout: 23456
      });
    }));

    it("accepts string url", () => cy.request("http://localhost:8080/status").then(function() {
      return this.expectOptionsToBe({
        url: "http://localhost:8080/status"
      });
    }));

    it("accepts method + url", () => cy.request("DELETE", "http://localhost:1234/users/1").then(function() {
      return this.expectOptionsToBe({
        url: "http://localhost:1234/users/1",
        method: "DELETE"
      });
    }));

    it("accepts method + url + body", () => cy.request("POST", "http://localhost:8080/users", {name: "brian"}).then(function() {
      return this.expectOptionsToBe({
        url: "http://localhost:8080/users",
        method: "POST",
        body: {name: "brian"},
        json: true
      });
    }));

    it("accepts url + body", () => cy.request("http://www.github.com/projects/foo", {commits: true}).then(function() {
      return this.expectOptionsToBe({
        url: "http://www.github.com/projects/foo",
        body: {commits: true},
        json: true
      });
    }));

    it("accepts url + string body", () => cy.request("http://www.github.com/projects/foo", "foo").then(function() {
      return this.expectOptionsToBe({
        url: "http://www.github.com/projects/foo",
        body: "foo"
      });
    }));

    context("method normalization", () => it("uppercases method", () => cy.request("post", "https://www.foo.com").then(function() {
      return this.expectOptionsToBe({
        url: "https://www.foo.com/",
        method: "POST"
      });
    })));

    context("url normalization", function() {
      it("uses absolute urls and adds trailing slash", function() {
        Cypress.config("baseUrl", "http://localhost:8080/app");

        return cy.request("https://www.foo.com").then(function() {
          return this.expectOptionsToBe({
            url: "https://www.foo.com/"
          });
        });
      });

      it("uses localhost urls", () => cy.request("localhost:1234").then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:1234/"
        });
      }));

      it("uses www urls", () => cy.request("www.foo.com").then(function() {
        return this.expectOptionsToBe({
          url: "http://www.foo.com/"
        });
      }));

      it("prefixes with baseUrl when origin is empty", function() {
        cy.stub(cy, "getRemoteLocation").withArgs("origin").returns("");
        Cypress.config("baseUrl", "http://localhost:8080/app");

        return cy.request("/foo/bar?cat=1").then(function() {
          return this.expectOptionsToBe({
            url: "http://localhost:8080/app/foo/bar?cat=1"
          });
        });
      });

      it("prefixes with baseUrl over current origin", function() {
        Cypress.config("baseUrl", "http://localhost:8080/app");
        cy.stub(cy, "getRemoteLocation").withArgs("origin").returns("http://localhost:1234");

        return cy.request("foobar?cat=1").then(function() {
          return this.expectOptionsToBe({
            url: "http://localhost:8080/app/foobar?cat=1"
          });
        });
      });

      //# https://github.com/cypress-io/cypress/issues/5274
      it("encode url with ’ character in pathname", () => cy.request({ url: 'http://localhost:1234/’' }).then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:1234/%E2%80%99"
        });
      }));

      it("dont re-encode url with ’ escaped in pathname", () => cy.request({ url: encodeURI('http://localhost:1234/’') }).then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:1234/%E2%80%99"
        });
      }));

      it("encode url with % character in pathname", () => cy.request({ url: 'http://localhost:1234/%' }).then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:1234/%"
        });
      }));

      it("dont re-encode url with % escaped in pathname", () => cy.request({ url: encodeURI('http://localhost:1234/%') }).then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:1234/%25"
        });
      }));

      it("encode url with Astral Plane Unicode in pathname", () => cy.request({ url: 'http://localhost:1234/😀' }).then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:1234/%F0%9F%98%80"
        });
      }));

      it("dont re-encode url with Astral Plane Unicode escaped character in pathname", () => cy.request({ url: encodeURI('http://localhost:1234/😀') }).then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:1234/%F0%9F%98%80"
        });
      }));

      it("should percent escape Unicode in pathname and convert Unicode in domain name properly", () => cy.request({ url: 'http://localhost😀:1234/😀' }).then(function() {
        return this.expectOptionsToBe({
          url: "http://xn--localhost-ob26h:1234/%F0%9F%98%80"
        });
      }));

      return it("should percent escape Unicode in pathname and convert Unicode in domain name with URI encoded URL", () => cy.request({ url: encodeURI('http://localhost😀:1234/😀') }).then(function() {
        return this.expectOptionsToBe({
          url: "http://xn--localhost-ob26h:1234/%F0%9F%98%80"
        });
      }));
    });

    context("gzip", () => it("can turn off gzipping", () => cy.request({
      url: "http://localhost:8080",
      gzip: false
    }).then(function() {
      return this.expectOptionsToBe({
        url: "http://localhost:8080/",
        gzip: false
      });
    })));

    context("auth", () => it("sends auth when it is an object", () => cy.request({
      url: "http://localhost:8888",
      auth: {
        user: "brian",
        pass: "password"
      }
    }).then(function() {
      return this.expectOptionsToBe({
        url: "http://localhost:8888/",
        auth: {
          user: "brian",
          pass: "password"
        }
      });
    })));

    context("followRedirect", function() {
      it("is true by default", () => cy.request("http://localhost:8888")
      .then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:8888/"
        });
      }));

      it("can be set to false", () => cy.request({
        url: "http://localhost:8888",
        followRedirect: false
      })
      .then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:8888/",
          followRedirect: false
        });
      }));

      return it("normalizes followRedirects -> followRedirect", () => cy.request({
        url: "http://localhost:8888",
        followRedirects: false
      })
      .then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:8888/",
          followRedirect: false
        });
      }));
    });

    context("qs", () => it("accepts an object literal", () => cy.request({
      url: "http://localhost:8888",
      qs: {
        foo: "bar"
      }
    })
    .then(function() {
      return this.expectOptionsToBe({
        url: "http://localhost:8888/",
        qs: {foo: "bar"}
      });
    })));

    return context("form", function() {
      it("accepts an object literal for body", () => cy.request({
        url: "http://localhost:8888",
        form: true,
        body: {
          foo: "bar"
        }
      })
      .then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:8888/",
          form: true,
          body: {foo: "bar"}
        });
      }));

      it("accepts a string for body", () => cy.request({
        url: "http://localhost:8888",
        form: true,
        body: "foo=bar&baz=quux"
      })
      .then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:8888/",
          form: true,
          body: "foo=bar&baz=quux"
        });
      }));

      //# https://github.com/cypress-io/cypress/issues/2923
      return it("application/x-www-form-urlencoded w/ an object body uses form: true", () => cy.request({
        url: "http://localhost:8888",
        headers: {
          "a": "b",
          "Content-type": "application/x-www-form-urlencoded"
        },
        body: { foo: "bar" }
      }).then(function() {
        return this.expectOptionsToBe({
          url: "http://localhost:8888/",
          form: true,
          headers: {
            "a": "b",
            "Content-type": "application/x-www-form-urlencoded"
          },
          body: { foo: "bar" }
        });
      }));
    });
  });

  describe("failOnStatus", () => it("is deprecated but does not fail even on 500 when failOnStatus=false", function() {
    const warning = cy.spy(Cypress.utils, "warning");

    const backend = Cypress.backend
    .withArgs("http:request")
    .resolves({ isOkStatusCode: false, status: 500 });

    return cy.request({
      url: "http://localhost:1234/foo",
      failOnStatus: false
    })
    .then(function(resp) {
      //# make sure it really was 500!
      expect(resp.status).to.eq(500);
      return expect(warning.lastCall.args[0]).to.include("The `cy.request()` `failOnStatus` option has been renamed to `failOnStatusCode`. Please update your code. This option will be removed at a later time.");
    });
  }));

  describe("failOnStatusCode", () => it("does not fail on status 401", function() {
    const backend = Cypress.backend
    .withArgs("http:request")
    .resolves({ isOkStatusCode: false, status: 401 });

    return cy.request({
      url: "http://localhost:1234/foo",
      failOnStatusCode: false
    })
    .then(resp => //# make sure it really was 500!
    expect(resp.status).to.eq(401));
  }));

  describe("method", () => it("can use M-SEARCH method", () => cy.request({
    url: 'http://localhost:3500/dump-method',
    method: 'm-Search'
  }).then(res => {
    return expect(res.body).to.contain('M-SEARCH');
  })));

  describe("headers", () => it("can send user-agent header", () => cy.request({
    url: "http://localhost:3500/dump-headers",
    headers: {
      "user-agent": "something special"
    }
  }).then(res => expect(res.body).to.contain('"user-agent":"something special"'))));

  describe("subjects", () => it("resolves with response obj", function() {
    const resp = {
      status: 200,
      isOkStatusCode: true,
      body: "<html>foo</html>",
      headers: {foo: "bar"}
    };

    const backend = Cypress.backend
    .withArgs("http:request")
    .resolves(resp);

    return cy.request("http://www.foo.com").then(subject => expect(subject).to.deep.eq(resp));
  }));

  describe("timeout", function() {
    beforeEach(function() {
      let backend;
      return backend = Cypress.backend
      .withArgs("http:request")
      .resolves({isOkStatusCode: true, status: 200});
    });

    it("sets timeout to Cypress.config(responseTimeout)", function() {
      Cypress.config("responseTimeout", 2500);

      const timeout = cy.spy(Promise.prototype, "timeout");

      return cy.request("http://www.foo.com").then(() => expect(timeout).to.be.calledWith(2500));
    });

    it("can override timeout", function() {
      const timeout = cy.spy(Promise.prototype, "timeout");

      return cy.request({url: "http://www.foo.com", timeout: 1000}).then(() => expect(timeout).to.be.calledWith(1000));
    });

    return it("clears the current timeout and restores after success", function() {
      cy.timeout(100);

      cy.spy(cy, "clearTimeout");

      return cy.request("http://www.foo.com").then(function() {
        expect(cy.clearTimeout).to.be.calledWith("http:request");

        //# restores the timeout afterwards
        return expect(cy.timeout()).to.eq(100);
      });
    });
  });

  describe(".log", function() {
    beforeEach(function() {
      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "request") {
          return this.lastLog = log;
        }
      });

      return null;
    });

    it("can turn off logging", function() {
      const backend = Cypress.backend
      .withArgs("http:request")
      .resolves({isOkStatusCode: true, status: 200});

      return cy.request({
        url: "http://localhost:8080",
        log: false
      }).then(function() {
        return expect(this.lastLog).to.be.undefined;
      });
    });

    it("logs immediately before resolving", function(done) {
      const backend = Cypress.backend
      .withArgs("http:request")
      .resolves({isOkStatusCode: true, status: 200});

      cy.on("log:added", function(attrs, log) {
        if (log.get("name") === "request") {
          expect(log.get("state")).to.eq("pending");
          expect(log.get("message")).to.eq("");
          return done();
        }
      });

      return cy.request("http://localhost:8080");
    });

    it("snapshots after clicking", function() {
      const backend = Cypress.backend
      .withArgs("http:request")
      .resolves({isOkStatusCode: true, status: 200});

      return cy.request("http://localhost:8080").then(function() {
        const {
          lastLog
        } = this;

        expect(lastLog.get("snapshots").length).to.eq(1);
        return expect(lastLog.get("snapshots")[0]).to.be.an("object");
      });
    });

    it(".consoleProps", function() {
      const allRequestResponse = {
        "Request URL": "http://localhost:8080/foo",
        "Request Headers": {"x-token": "ab123"},
        "Request Body": {first: "brian"},
        "Response Headers": {
          "Content-Type": "application/json"
        },
        "Response Body": {id: 123}
      };

      const backend = Cypress.backend
      .withArgs("http:request")
      .resolves({
        duration: 10,
        status: 201,
        isOkStatusCode: true,
        body: {id: 123},
        headers: {
          "Content-Type": "application/json"
        },
        requestHeaders: {"x-token": "ab123"},
        requestBody: {first: "brian"},
        allRequestResponses: [allRequestResponse]
      });

      return cy.request({
        url: "http://localhost:8080/foo",
        headers: {"x-token": "abc123"},
        method: "POST",
        body: {first: "brian"}
      }).then(function() {
        return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "request",
          Request: allRequestResponse,
          Yielded: {
            duration: 10,
            status: 201,
            body: {id: 123},
            headers: {
              "Content-Type": "application/json"
            }
          }
        });
      });
    });

    it(".consoleProps with array of allRequestResponses", function() {
      const allRequestResponses = [{
        "Request URL": "http://localhost:8080/foo",
        "Request Headers": {"x-token": "ab123"},
        "Request Body": {first: "brian"},
        "Response Headers": {
          "Content-Type": "application/json"
        },
        "Response Body": {id: 123}
      }, {
        "Request URL": "http://localhost:8080/foo",
        "Request Headers": {"x-token": "ab123"},
        "Request Body": {first: "brian"},
        "Response Headers": {
          "Content-Type": "application/json"
        },
        "Response Body": {id: 123}
      }];

      const backend = Cypress.backend
      .withArgs("http:request")
      .resolves({
        duration: 10,
        status: 201,
        isOkStatusCode: true,
        body: {id: 123},
        headers: {
          "Content-Type": "application/json"
        },
        requestHeaders: {"x-token": "ab123"},
        requestBody: {first: "brian"},
        allRequestResponses
      });

      return cy.request({
        url: "http://localhost:8080/foo",
        headers: {"x-token": "abc123"},
        method: "POST",
        body: {first: "brian"}
      }).then(function() {
        return expect(this.lastLog.invoke("consoleProps")).to.deep.eq({
          Command: "request",
          Requests: allRequestResponses,
          Yielded: {
            duration: 10,
            status: 201,
            body: {id: 123},
            headers: {
              "Content-Type": "application/json"
            }
          }
        });
      });
    });

    return describe(".renderProps", function() {
      describe("in any case", () => it("sends correct message", function() {
        const backend = Cypress.backend
        .withArgs("http:request")
        .resolves({ isOkStatusCode: true, status: 201 });

        return cy.request("http://localhost:8080/foo").then(function() {
          return expect(this.lastLog.invoke("renderProps").message).to.equal("GET 201 http://localhost:8080/foo");
        });
      }));

      describe("when response is successful", () => it("sends correct indicator", function() {
        const backend = Cypress.backend
        .withArgs("http:request")
        .resolves({ isOkStatusCode: true, status: 201 });

        return cy.request("http://localhost:8080/foo").then(function() {
          return expect(this.lastLog.invoke("renderProps").indicator).to.equal("successful");
        });
      }));

      return describe("when response is outside 200 range", () => it("sends correct indicator", function(done) {
        cy.on("fail", err => {
          expect(this.lastLog.invoke("renderProps").indicator).to.equal("bad");
          return done();
        });

        const backend = Cypress.backend
        .withArgs("http:request")
        .resolves({ status: 500 });

        return cy.request("http://localhost:8080/foo");
      }));
    });
  });

  return describe("errors", function() {
    beforeEach(function() {
      Cypress.config("defaultCommandTimeout", 50);

      this.logs = [];

      cy.on("log:added", (attrs, log) => {
        if (attrs.name === "request") {
          this.lastLog = log;
          return this.logs.push(log);
        }
      });

      return null;
    });

    it("throws when no url is passed", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` requires a `url`. You did not provide a `url`.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request();
    });

    it("throws when url is not FQDN", function(done) {
      Cypress.config("baseUrl", "");
      cy.stub(cy, "getRemoteLocation").withArgs("origin").returns("");

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` must be provided a fully qualified `url` - one that begins with `http`. By default `cy.request()` will use either the current window's origin or the `baseUrl` in `cypress.json`. Neither of those values were present.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request("/foo/bar");
    });

    it("throws when url is not FQDN, notes that configFile is disabled", function(done) {
      Cypress.config("baseUrl", "");
      Cypress.config("configFile", false);
      cy.stub(cy, "getRemoteLocation").withArgs("origin").returns("");

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` must be provided a fully qualified `url` - one that begins with `http`. By default `cy.request()` will use either the current window's origin or the `baseUrl` in `cypress.json` (currently disabled by --config-file=false). Neither of those values were present.");
        return done();
      });

      return cy.request("/foo/bar");
    });

    it("throws when url is not FQDN, notes that configFile is non-default", function(done) {
      Cypress.config("baseUrl", "");
      Cypress.config("configFile", "foo.json");
      cy.stub(cy, "getRemoteLocation").withArgs("origin").returns("");

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` must be provided a fully qualified `url` - one that begins with `http`. By default `cy.request()` will use either the current window's origin or the `baseUrl` in `foo.json`. Neither of those values were present.");
        return done();
      });

      return cy.request("/foo/bar");
    });

    it("throws when url isnt a string", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` requires the `url` to be a string.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request({
        url: []
      });
    });

    it("throws when auth is truthy but not an object", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` must be passed an object literal for the `auth` option.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request({
        url: "http://localhost:1234/foo",
        auth: "foobar"
      });
    });

    it("throws when headers is truthy but not an object", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` requires the `headers` option to be an object literal.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request({
        url: "http://localhost:1234/foo",
        headers: "foo=bar"
      });
    });

    it("throws on invalid method", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` was called with an invalid method: `FOO`. Method can be: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`, or any other method supported by Node's HTTP parser.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request({
        url: "http://localhost:1234/foo",
        method: "FOO"
      });
    });

    it("throws when gzip is not boolean", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` requires the `gzip` option to be a boolean.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request({
        url: "http://localhost:1234/foo",
        gzip: {}
      });
    });

    it("throws when form isnt a boolean", function(done) {
      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq("`cy.request()` requires the `form` option to be a boolean.\n\nIf you're trying to send a `x-www-form-urlencoded` request then pass either a string or object literal to the `body` property.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request({
        url: "http://localhost:1234/foo",
        form: {foo: "bar"}
      });
    });

    it("throws when failOnStatusCode is false and retryOnStatusCodeFailure is true", function(done) {
      cy.on("fail", function(err) {
        expect(err.message).to.contain("`cy.request()` was invoked with `{ failOnStatusCode: false, retryOnStatusCodeFailure: true }`.");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        return done();
      });

      return cy.request({
        url: "http://foobarbaz",
        failOnStatusCode: false,
        retryOnStatusCodeFailure: true
      });
    });

    it("throws when status code doesnt start with 2 and failOnStatusCode is true", function(done) {
      const backend = Cypress.backend
      .withArgs("http:request")
      .resolves({
        isOkStatusCode: false,
        status: 500,
        statusText: "Server Error",
        headers: {
          baz: "quux"
        },
        body: "response body",
        requestHeaders: {
          foo: "bar"
        },
        requestBody: "request body",
        redirects: [
          "301: http://www.google.com"
        ]
      });

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        expect(err.message).to.include(`\
\`cy.request()\` failed on:

http://localhost:1234/foo

The response we received from your web server was:

> 500: Server Error

This was considered a failure because the status code was not \`2xx\` or \`3xx\`.

If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\`

-----------------------------------------------------------

The request we sent was:

Method: POST
URL: http://localhost:1234/foo
Headers: {
\"foo\": \"bar\"
}
Body: request body
Redirects: [
\"301: http://www.google.com\"
]

-----------------------------------------------------------

The response we got was:

Status: 500 - Server Error
Headers: {
\"baz\": \"quux\"
}
Body: response body\
`);
        return done();
      });

      return cy.request({
        method: "POST",
        url: "http://localhost:1234/foo",
        body: {
          username: "cypress"
        }
      });
    });

    //# https://github.com/cypress-io/cypress/issues/4346
    it("throws on network failure when nested", function(done) {
      cy.request("http://localhost:3500/dump-method")
      .then(() => cy.request("http://0.0.0.0:12345"));

      return cy.on("fail", function(err) {
        expect(err.message).to.include("`cy.request()` failed trying to load:");
        return done();
      });
    });

    it("displays body_circular when body is circular", function(done) {
      const foo = {
        bar: {
          baz: {}
        }
      };

      foo.bar.baz.quux = foo;

      cy.request({
        method: "POST",
        url: "http://foo.invalid/",
        body: foo
      });

      return cy.on("fail", err => {
        const {
          lastLog
        } = this;
        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.message).to.eq(`\
The \`body\` parameter supplied to \`cy.request()\` contained a circular reference at the path "bar.baz.quux".

\`body\` can only be a string or an object with no circular references.\
`
        );
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");

        return done();
      });
    });

    it("does not include redirects when there were no redirects", function(done) {
      const backend = Cypress.backend
      .withArgs("http:request")
      .resolves({
        isOkStatusCode: false,
        status: 500,
        statusText: "Server Error",
        headers: {
          baz: "quux"
        },
        body: "response body",
        requestHeaders: {
          foo: "bar"
        },
        requestBody: "request body"
      });

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        expect(err.docsUrl).to.eq("https://on.cypress.io/request");
        expect(err.message).to.include(`\
\`cy.request()\` failed on:

http://localhost:1234/foo

The response we received from your web server was:

> 500: Server Error

This was considered a failure because the status code was not \`2xx\` or \`3xx\`.

If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\`

-----------------------------------------------------------

The request we sent was:

Method: POST
URL: http://localhost:1234/foo
Headers: {
\"foo\": \"bar\"
}
Body: request body

-----------------------------------------------------------

The response we got was:

Status: 500 - Server Error
Headers: {
\"baz\": \"quux\"
}
Body: response body\
`);
        return done();
      });

      return cy.request({
        method: "POST",
        url: "http://localhost:1234/foo",
        body: {
          username: "cypress"
        }
      });
    });

    it("logs once on error", function(done) {
      const error = new Error("request failed");
      error.backend = true;

      const backend = Cypress.backend
      .withArgs("http:request")
      .rejects(error);

      cy.on("fail", err => {
        const {
          lastLog
        } = this;

        expect(this.logs.length).to.eq(1);
        expect(lastLog.get("error")).to.eq(err);
        expect(lastLog.get("state")).to.eq("failed");
        return done();
      });

      return cy.request("http://localhost:1234/foo");
    });

    //# https://github.com/cypress-io/cypress/issues/5274
    it("dont throw UNESCAPED_CHARACTERS error for url with ’ character in pathname", function(done) {
      cy.on("fail", function(err) {
        expect(err.message).to.contain("`cy.request()` failed trying to load:");
        expect(err.message).to.not.contain("ERR_UNESCAPED_CHARACTERS");
        return done();
      });

      return cy.request("http://localhost:1234/’");
    });

    it("dont throw UNESCAPED_CHARACTERS error for url with % character in pathname", function(done) {
      cy.on("fail", function(err) {
        expect(err.message).to.contain("`cy.request()` failed trying to load:");
        expect(err.message).to.not.contain("ERR_UNESCAPED_CHARACTERS");
        return done();
      });

      return cy.request("http://localhost:1234/%");
    });

    it("dont throw UNESCAPED_CHARACTERS error for url with ’ escaped in pathname", function(done) {
      cy.on("fail", function(err) {
        expect(err.message).to.contain("`cy.request()` failed trying to load:");
        expect(err.message).to.not.contain("ERR_UNESCAPED_CHARACTERS");
        return done();
      });

      return cy.request(encodeURI('http://localhost:1234/’'));
    });

    it("dont throw UNESCAPED_CHARACTERS error for url with Unicode in pathname from BMP to Astral Plane", function(done) {
      cy.on("fail", function(err) {
        expect(err.message).to.contain("`cy.request()` failed trying to load:");
        expect(err.message).to.not.contain("ERR_UNESCAPED_CHARACTERS");
        return done();
      });

      return cy.request('http://localhost:1234/😀');
    });

    it("dont throw UNESCAPED_CHARACTERS error for url with any Unicode escaped character in pathname", function(done) {
      cy.on("fail", function(err) {
        expect(err.message).to.contain("`cy.request()` failed trying to load:");
        expect(err.message).to.not.contain("ERR_UNESCAPED_CHARACTERS");
        return done();
      });

      return cy.request(encodeURI('http://localhost:1234/😀'));
    });

    return context("displays error", function() {
      it("displays method and url in error", function(done) {
        const error = new Error("request failed");
        error.backend = true;

        const backend = Cypress.backend
        .withArgs("http:request")
        .rejects(error);

        cy.on("fail", err => {
          expect(err.message).to.include(`\
\`cy.request()\` failed trying to load:

http://localhost:1234/foo

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

> request failed

-----------------------------------------------------------

The request we sent was:

Method: GET
URL: http://localhost:1234/foo

-----------------------------------------------------------

Common situations why this would fail:
- you don't have internet access
- you forgot to run / boot your web server
- your web server isn't accessible
- you have weird network configuration settings on your computer

The stack trace for this error is:\
`);
          expect(err.docsUrl).to.eq("https://on.cypress.io/request");
          return done();
        });

        return cy.request("http://localhost:1234/foo");
      });

      return it("throws after timing out", function(done) {
        const backend = Cypress.backend
        .withArgs("http:request")
        .resolves(Promise.delay(1000));

        cy.on("fail", err => {
          const {
            lastLog
          } = this;

          expect(this.logs.length).to.eq(1);
          expect(lastLog.get("error")).to.eq(err);
          expect(lastLog.get("state")).to.eq("failed");
          expect(err.docsUrl).to.eq("https://on.cypress.io/request");
          expect(err.message).to.eq(`\
\`cy.request()\` timed out waiting \`50ms\` for a response from your server.

The request we sent was:

Method: GET
URL: http://localhost:1234/foo

No response was received within the timeout.\
`);
          return done();
        });

        return cy.request({url: "http://localhost:1234/foo", timeout: 50});
      });
    });
  });
}));
