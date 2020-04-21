/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _       = require("lodash");
const http    = require("http");
const Bluebird = require("bluebird");
const Request = require(`${root}lib/request`);
const snapshot = require("snap-shot-it");

const request = Request({timeout: 100});

const testAttachingCookiesWith = function(fn) {
  const set = sinon.spy(request, 'setCookiesOnBrowser');
  const get = sinon.spy(request, 'setRequestCookieHeader');

  nock("http://localhost:1234")
  .get("/")
  .reply(302, "", {
    'set-cookie': 'one=1',
    location: "/second"
  })
  .get("/second")
  .reply(302, "", {
    'set-cookie': 'two=2',
    location: "/third"
  })
  .get("/third")
  .reply(200, "", {
    'set-cookie': 'three=3'
  });

  return fn()
  .then(() => snapshot({
    setCalls: set.getCalls().map(call => ({
      currentUrl: call.args[1],
      setCookie: call.args[0].headers['set-cookie']
    })),
    getCalls: get.getCalls().map(call => ({
      newUrl: _.get(call, 'args.1')
    }))
  }));
};

describe("lib/request", function() {
  beforeEach(function() {
    this.fn = sinon.stub();
    this.fn.withArgs('set:cookie').resolves({});
    return this.fn.withArgs('get:cookies').resolves([]);
  });

  it("is defined", () => expect(request).to.be.an("object"));

  context("#getDelayForRetry", function() {
    it("divides by 10 when delay >= 1000 and err.code = ECONNREFUSED", function() {
      const retryIntervals = [1,2,3,4];
      const delaysRemaining = [0, 999, 1000, 2000];

      const err = {
        code: "ECONNREFUSED"
      };

      const onNext = sinon.stub();

      retryIntervals.forEach(() => request.getDelayForRetry({
        err,
        onNext,
        retryIntervals,
        delaysRemaining,
      }));

      expect(delaysRemaining).to.be.empty;
      return expect(onNext.args).to.deep.eq([
        [0, 1],
        [999, 2],
        [100, 3],
        [200, 4]
      ]);
    });

    it("does not divide by 10 when err.code != ECONNREFUSED", function() {
      const retryIntervals = [1,2,3,4];
      const delaysRemaining = [2000, 2000, 2000, 2000];

      const err = {
        code: "ECONNRESET"
      };

      const onNext = sinon.stub();

      request.getDelayForRetry({
        err,
        onNext,
        retryIntervals,
        delaysRemaining,
      });

      expect(delaysRemaining).to.have.length(3);
      return expect(onNext).to.be.calledWith(2000, 1);
    });

    return it("calls onElse when delaysRemaining is exhausted", function() {
      const retryIntervals = [1,2,3,4];
      const delaysRemaining = [];

      const onNext = sinon.stub();
      const onElse = sinon.stub();

      request.getDelayForRetry({
        onElse,
        onNext,
        retryIntervals,
        delaysRemaining,
      });

      expect(onElse).to.be.calledWithExactly();
      return expect(onNext).not.to.be.called;
    });
  });

  context("#setDefaults", function() {
    it("delaysRemaining to retryIntervals clone", function() {
      const retryIntervals = [1,2,3,4];

      const opts = request.setDefaults({ retryIntervals });

      expect(opts.retryIntervals).to.eq(retryIntervals);
      expect(opts.delaysRemaining).not.to.eq(retryIntervals);
      return expect(opts.delaysRemaining).to.deep.eq(retryIntervals);
    });

    it("retryIntervals to [0, 1000, 2000, 2000] by default", function() {
      const opts = request.setDefaults({});

      return expect(opts.retryIntervals).to.deep.eq([0, 1000, 2000, 2000]);
    });

    return it("delaysRemaining can be overridden", function() {
      const delaysRemaining = [1];
      const opts = request.setDefaults({ delaysRemaining });

      return expect(opts.delaysRemaining).to.eq(delaysRemaining);
    });
  });

  context("#normalizeResponse", function() {
    beforeEach(function() {
      return this.push = sinon.stub();
    });

    it("sets status to statusCode and deletes statusCode", function() {
      expect(request.normalizeResponse(this.push, {
        statusCode: 404,
        request: {
          headers: {foo: "bar"},
          body: "body"
        }
      })).to.deep.eq({
        status: 404,
        statusText: "Not Found",
        isOkStatusCode: false,
        requestHeaders: {foo: "bar"},
        requestBody: "body"
      });

      return expect(this.push).to.be.calledOnce;
    });

    return it("picks out status body and headers", function() {
      expect(request.normalizeResponse(this.push, {
        foo: "bar",
        req: {},
        originalHeaders: {},
        headers: {"Content-Length": 50},
        body: "<html>foo</html>",
        statusCode: 200,
        request: {
          headers: {foo: "bar"},
          body: "body"
        }
      })).to.deep.eq({
        body: "<html>foo</html>",
        headers: {"Content-Length": 50},
        status: 200,
        statusText: "OK",
        isOkStatusCode: true,
        requestHeaders: {foo: "bar"},
        requestBody: "body"
      });

      return expect(this.push).to.be.calledOnce;
    });
  });

  context("#create", function() {
    beforeEach(function(done) {
      this.hits = 0;

      this.srv = http.createServer((req, res) => {
        this.hits++;

        switch (req.url) {
          case "/never-ends":
            res.writeHead(200);
            return res.write("foo\n");
          case "/econnreset":
            return req.socket.destroy();
        }
      });

      return this.srv.listen(9988, done);
    });

    afterEach(function() {
      return this.srv.close();
    });

    context("retries for streams", function() {
      it("does not retry on a timeout", function() {
        const opts = request.setDefaults({
          url: "http://localhost:9988/never-ends",
          timeout: 1000
        });

        const stream = request.create(opts);

        let retries = 0;

        stream.on("retry", () => retries++);

        const p = Bluebird.fromCallback(cb => stream.on("error", cb));

        return expect(p).to.be.rejected
        .then(function(err) {
          expect(err.code).to.eq('ESOCKETTIMEDOUT');
          return expect(retries).to.eq(0);
        });
      });

      it("retries 4x on a connection reset", function() {
        const opts = {
          url: "http://localhost:9988/econnreset",
          retryIntervals: [0, 1, 2, 3],
          timeout: 1000
        };

        const stream = request.create(opts);

        let retries = 0;

        stream.on("retry", () => retries++);

        const p = Bluebird.fromCallback(cb => stream.on("error", cb));

        return expect(p).to.be.rejected
        .then(function(err) {
          expect(err.code).to.eq('ECONNRESET');
          return expect(retries).to.eq(4);
        });
      });

      return it("retries 4x on a NXDOMAIN (ENOTFOUND)", function() {
        nock.enableNetConnect();

        const opts = {
          url: "http://will-never-exist.invalid.example.com",
          retryIntervals: [0, 1, 2, 3],
          timeout: 1000
        };

        const stream = request.create(opts);

        let retries = 0;

        stream.on("retry", () => retries++);

        const p = Bluebird.fromCallback(cb => stream.on("error", cb));

        return expect(p).to.be.rejected
        .then(function(err) {
          expect(err.code).to.eq('ENOTFOUND');
          return expect(retries).to.eq(4);
        });
      });
    });

    return context("retries for promises", function() {
      it("does not retry on a timeout", function() {
        const opts = {
          url: "http://localhost:9988/never-ends",
          timeout: 100
        };

        return request.create(opts, true)
        .then(function() {
          throw new Error('should not reach');}).catch(err => {
          expect(err.error.code).to.eq('ESOCKETTIMEDOUT');
          return expect(this.hits).to.eq(1);
        });
      });

      return it("retries 4x on a connection reset", function() {
        const opts = {
          url: "http://localhost:9988/econnreset",
          retryIntervals: [0, 1, 2, 3],
          timeout: 250
        };

        return request.create(opts, true)
        .then(function() {
          throw new Error('should not reach');}).catch(err => {
          expect(err.error.code).to.eq('ECONNRESET');
          return expect(this.hits).to.eq(5);
        });
      });
    });
  });

  context("#sendPromise", function() {
    it("sets strictSSL=false", function() {
      const init = sinon.spy(request.rp.Request.prototype, "init");

      nock("http://www.github.com")
      .get("/foo")
      .reply(200, "hello", {
        "Content-Type": "text/html"
      });

      return request.sendPromise({}, this.fn, {
        url: "http://www.github.com/foo",
        cookies: false
      })
      .then(() => expect(init).to.be.calledWithMatch({strictSSL: false}));
    });

    it("sets simple=false", function() {
      nock("http://www.github.com")
      .get("/foo")
      .reply(500, "");

      //# should not bomb on 500
      //# because simple = false
      return request.sendPromise({}, this.fn, {
        url: "http://www.github.com/foo",
        cookies: false
      });
    });

    it("sets resolveWithFullResponse=true", function() {
      nock("http://www.github.com")
      .get("/foo")
      .reply(200, "hello", {
        "Content-Type": "text/html"
      });

      return request.sendPromise({}, this.fn, {
        url: "http://www.github.com/foo",
        cookies: false,
        body: "foobarbaz"
      })
      .then(function(resp) {
        expect(resp).to.have.keys("status", "body", "headers", "duration", "isOkStatusCode", "statusText", "allRequestResponses", "requestBody", "requestHeaders");

        expect(resp.status).to.eq(200);
        expect(resp.statusText).to.eq("OK");
        expect(resp.body).to.eq("hello");
        expect(resp.headers).to.deep.eq({"content-type": "text/html"});
        expect(resp.isOkStatusCode).to.be.true;
        expect(resp.requestBody).to.eq("foobarbaz");
        expect(resp.requestHeaders).to.deep.eq({
          "accept": "*/*",
          "accept-encoding": "gzip, deflate",
          "connection": "keep-alive",
          "content-length": 9,
          "host": "www.github.com"
        });
        return expect(resp.allRequestResponses).to.deep.eq([
          {
            "Request Body":     "foobarbaz",
            "Request Headers":  {"accept": "*/*", "accept-encoding": "gzip, deflate", "connection": "keep-alive", "content-length": 9, "host": "www.github.com"},
            "Request URL":      "http://www.github.com/foo",
            "Response Body":    "hello",
            "Response Headers": {"content-type": "text/html"},
            "Response Status":  200
          }
        ]);
      });
    });

    it("includes redirects", function() {
      this.fn.resolves();

      nock("http://www.github.com")
      .get("/dashboard")
      .reply(301, null, {
        "location": "/auth"
      })
      .get("/auth")
      .reply(302, null, {
        "location": "/login"
      })
      .get("/login")
      .reply(200, "log in", {
        "Content-Type": "text/html"
      });

      return request.sendPromise({}, this.fn, {
        url: "http://www.github.com/dashboard",
        cookies: false
      })
      .then(function(resp) {
        expect(resp).to.have.keys("status", "body", "headers", "duration", "isOkStatusCode", "statusText", "allRequestResponses", "redirects", "requestBody", "requestHeaders");

        expect(resp.status).to.eq(200);
        expect(resp.statusText).to.eq("OK");
        expect(resp.body).to.eq("log in");
        expect(resp.headers).to.deep.eq({"content-type": "text/html"});
        expect(resp.isOkStatusCode).to.be.true;
        expect(resp.requestBody).to.be.undefined;
        expect(resp.redirects).to.deep.eq([
          "301: http://www.github.com/auth",
          "302: http://www.github.com/login"
        ]);
        expect(resp.requestHeaders).to.deep.eq({
          "accept": "*/*",
          "accept-encoding": "gzip, deflate",
          "connection": "keep-alive",
          "referer": "http://www.github.com/auth",
          "host": "www.github.com"
        });
        return expect(resp.allRequestResponses).to.deep.eq([
          {
            "Request Body":     null,
            "Request Headers":  {"accept": "*/*", "accept-encoding": "gzip, deflate", "connection": "keep-alive", "host": "www.github.com"},
            "Request URL":      "http://www.github.com/dashboard",
            "Response Body":    null,
            "Response Headers": {"content-type": "application/json", "location": "/auth"},
            "Response Status":  301
          }, {
            "Request Body":     null,
            "Request Headers":  {"accept": "*/*", "accept-encoding": "gzip, deflate", "connection": "keep-alive", "host": "www.github.com", "referer": "http://www.github.com/dashboard"},
            "Request URL":      "http://www.github.com/auth",
            "Response Body":    null,
            "Response Headers": {"content-type": "application/json", "location": "/login"},
            "Response Status":  302
          }, {
            "Request Body":     null,
            "Request Headers":  {"accept": "*/*", "accept-encoding": "gzip, deflate", "connection": "keep-alive", "host": "www.github.com", "referer": "http://www.github.com/auth"},
            "Request URL":      "http://www.github.com/login",
            "Response Body":    "log in",
            "Response Headers": {"content-type": "text/html"},
            "Response Status":  200
          }
        ]);
      });
    });

    it("catches errors", function() {
      nock.enableNetConnect();

      const req = Request({ timeout: 2000 });

      return req.sendPromise({}, this.fn, {
        url: "http://localhost:1111/foo",
        cookies: false
      })
      .then(function() {
        throw new Error("should have failed but didnt");}).catch(err => expect(err.message).to.eq("Error: connect ECONNREFUSED 127.0.0.1:1111"));
    });

    it("parses response body as json if content-type application/json response headers", function() {
      nock("http://localhost:8080")
      .get("/status.json")
      .reply(200, JSON.stringify({status: "ok"}), {
        "Content-Type": "application/json"
      });

      return request.sendPromise({}, this.fn, {
        url: "http://localhost:8080/status.json",
        cookies: false
      })
      .then(resp => expect(resp.body).to.deep.eq({status: "ok"}));
    });

    it("parses response body as json if content-type application/vnd.api+json response headers", function() {
      nock("http://localhost:8080")
      .get("/status.json")
      .reply(200, JSON.stringify({status: "ok"}), {
        "Content-Type": "application/vnd.api+json"
      });

      return request.sendPromise({}, this.fn, {
        url: "http://localhost:8080/status.json",
        cookies: false
      })
      .then(resp => expect(resp.body).to.deep.eq({status: "ok"}));
    });

    it("revives from parsing bad json", function() {
      nock("http://localhost:8080")
      .get("/status.json")
      .reply(200, "{bad: 'json'}", {
        "Content-Type": "application/json"
      });

      return request.sendPromise({}, this.fn, {
        url: "http://localhost:8080/status.json",
        cookies: false
      })
      .then(resp => expect(resp.body).to.eq("{bad: 'json'}"));
    });

    it("sets duration on response", function() {
      nock("http://localhost:8080")
      .get("/foo")
      .delay(10)
      .reply(200, "123", {
        "Content-Type": "text/plain"
      });

      return request.sendPromise({}, this.fn, {
        url: "http://localhost:8080/foo",
        cookies: false
      })
      .then(function(resp) {
        expect(resp.duration).to.be.a("Number");
        return expect(resp.duration).to.be.gt(0);
      });
    });

    it("sends up user-agent headers", function() {
      nock("http://localhost:8080")
      .matchHeader("user-agent", "foobarbaz")
      .get("/foo")
      .reply(200, "derp");

      const headers = {};
      headers["user-agent"] = "foobarbaz";

      return request.sendPromise(headers, this.fn, {
        url: "http://localhost:8080/foo",
        cookies: false
      })
      .then(resp => expect(resp.body).to.eq("derp"));
    });

    it("sends connection: keep-alive by default", function() {
      nock("http://localhost:8080")
      .matchHeader("connection", "keep-alive")
      .get("/foo")
      .reply(200, "it worked");

      return request.sendPromise({}, this.fn, {
        url: "http://localhost:8080/foo",
        cookies: false
      })
      .then(resp => expect(resp.body).to.eq("it worked"));
    });

    it("lower cases headers", function() {
      nock("http://localhost:8080")
      .matchHeader("test", "true")
      .get("/foo")
      .reply(200, "derp");

      const headers = {};
      headers["user-agent"] = "foobarbaz";

      return request.sendPromise(headers, this.fn, {
        url: "http://localhost:8080/foo",
        cookies: false,
        headers: {
          'TEST': true,
        }
      })
      .then(resp => expect(resp.body).to.eq("derp"));
    });

    it("allows overriding user-agent in headers", function() {
      nock("http://localhost:8080")
      .matchHeader("user-agent", "custom-agent")
      .get("/foo")
      .reply(200, "derp");

      const headers = {'user-agent': 'test'};

      return request.sendPromise(headers, this.fn, {
        url: "http://localhost:8080/foo",
        cookies: false,
        headers: {
          'User-Agent': "custom-agent",
        },
      })
      .then(resp => expect(resp.body).to.eq("derp"));
    });

    context("accept header", function() {
      it("sets to */* by default", function() {
        nock("http://localhost:8080")
        .matchHeader("accept", "*/*")
        .get("/headers")
        .reply(200);

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/headers",
          cookies: false
        })
        .then(resp => expect(resp.status).to.eq(200));
      });

      it("can override accept header", function() {
        nock("http://localhost:8080")
        .matchHeader("accept", "text/html")
        .get("/headers")
        .reply(200);

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/headers",
          cookies: false,
          headers: {
            accept: "text/html"
          }
        })
        .then(resp => expect(resp.status).to.eq(200));
      });

      return it("can override Accept header", function() {
        nock("http://localhost:8080")
        .matchHeader("accept", "text/plain")
        .get("/headers")
        .reply(200);

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/headers",
          cookies: false,
          headers: {
            Accept: "text/plain"
          }
        })
        .then(resp => expect(resp.status).to.eq(200));
      });
    });

    context("qs", () => it("can accept qs", function() {
      nock("http://localhost:8080")
      .get("/foo?bar=baz&q=1")
      .reply(200);

      return request.sendPromise({}, this.fn, {
        url: "http://localhost:8080/foo",
        cookies: false,
        qs: {
          bar: "baz",
          q: 1
        }
      })
      .then(resp => expect(resp.status).to.eq(200));
    }));

    context("followRedirect", function() {
      beforeEach(function() {
        return this.fn.resolves();
      });

      it("by default follow redirects", function() {
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "http://localhost:8080/login"
        })
        .get("/login")
        .reply(200, "login");

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/dashboard",
          cookies: false,
          followRedirect: true
        })
        .then(function(resp) {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.eq("login");
          return expect(resp).not.to.have.property("redirectedToUrl");
        });
      });

      it("follows non-GET redirects by default", function() {
        nock("http://localhost:8080")
        .post("/login")
        .reply(302, "", {
          location: "http://localhost:8080/dashboard"
        })
        .get("/dashboard")
        .reply(200, "dashboard");

        return request.sendPromise({}, this.fn, {
          method: "POST",
          url: "http://localhost:8080/login",
          cookies: false
        })
        .then(function(resp) {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.eq("dashboard");
          return expect(resp).not.to.have.property("redirectedToUrl");
        });
      });

      it("can turn off following redirects", function() {
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "http://localhost:8080/login"
        })
        .get("/login")
        .reply(200, "login");

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/dashboard",
          cookies: false,
          followRedirect: false
        })
        .then(function(resp) {
          expect(resp.status).to.eq(302);
          expect(resp.body).to.eq("");
          return expect(resp.redirectedToUrl).to.eq("http://localhost:8080/login");
        });
      });

      it("resolves redirectedToUrl on relative redirects", function() {
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "/login" //# absolute-relative pathname
        })
        .get("/login")
        .reply(200, "login");

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/dashboard",
          cookies: false,
          followRedirect: false
        })
        .then(function(resp) {
          expect(resp.status).to.eq(302);
          return expect(resp.redirectedToUrl).to.eq("http://localhost:8080/login");
        });
      });

      it("resolves redirectedToUrl to another domain", function() {
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(301, "", {
          location: "https://www.google.com/login"
        })
        .get("/login")
        .reply(200, "login");

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/dashboard",
          cookies: false,
          followRedirect: false
        })
        .then(function(resp) {
          expect(resp.status).to.eq(301);
          return expect(resp.redirectedToUrl).to.eq("https://www.google.com/login");
        });
      });

      it("does not included redirectedToUrl when following redirects", function() {
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "http://localhost:8080/login"
        })
        .get("/login")
        .reply(200, "login");

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/dashboard",
          cookies: false
        })
        .then(function(resp) {
          expect(resp.status).to.eq(200);
          return expect(resp).not.to.have.property("redirectedToUrl");
        });
      });

      return it("gets + attaches the cookies at each redirect", function() {
        return testAttachingCookiesWith(() => {
          return request.sendPromise({}, this.fn, {
            url: "http://localhost:1234/"
          });
        });
      });
    });

    context("form=true", function() {
      beforeEach(() => nock("http://localhost:8080")
      .matchHeader("Content-Type", "application/x-www-form-urlencoded")
      .post("/login", "foo=bar&baz=quux")
      .reply(200, "<html></html>"));

      it("takes converts body to x-www-form-urlencoded and sets header", function() {
        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/login",
          method: "POST",
          cookies: false,
          form: true,
          body: {
            foo: "bar",
            baz: "quux"
          }
        })
        .then(function(resp) {
          expect(resp.status).to.eq(200);
          return expect(resp.body).to.eq("<html></html>");
        });
      });

      it("does not send body", function() {
        const init = sinon.spy(request.rp.Request.prototype, "init");

        const body =  {
          foo: "bar",
          baz: "quux"
        };

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/login",
          method: "POST",
          cookies: false,
          form: true,
          json: true,
          body
        })
        .then(function(resp) {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.eq("<html></html>");
          return expect(init).not.to.be.calledWithMatch({body});
        });
      });

      return it("does not set json=true", function() {
        const init = sinon.spy(request.rp.Request.prototype, "init");

        return request.sendPromise({}, this.fn, {
          url: "http://localhost:8080/login",
          method: "POST",
          cookies: false,
          form: true,
          json: true,
          body: {
            foo: "bar",
            baz: "quux"
          }
        })
        .then(function(resp) {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.eq("<html></html>");
          return expect(init).not.to.be.calledWithMatch({json: true});
        });
      });
    });

    return context("bad headers", function() {
      beforeEach(function(done) {
        this.srv = http.createServer(function(req, res) {
          res.writeHead(200);
          return res.end();
        });

        return this.srv.listen(9988, done);
      });

      afterEach(function() {
        return this.srv.close();
      });

      it("recovers from bad headers", function() {
        return request.sendPromise({}, this.fn, {
          url: "http://localhost:9988/foo",
          cookies: false,
          headers: {
            "x-text": "אבגד"
          }
        })
        .then(function() {
          throw new Error("should have failed");}).catch(err => expect(err.message).to.eq("TypeError [ERR_INVALID_CHAR]: Invalid character in header content [\"x-text\"]"));
      });

      return it("handles weird content in the body just fine", function() {
        return request.sendPromise({}, this.fn, {
          url: "http://localhost:9988/foo",
          cookies: false,
          json: true,
          body: {
            "x-text": "אבגד"
          }
        });
      });
    });
  });

  return context("#sendStream", function() {
    it("allows overriding user-agent in headers", function() {
      nock("http://localhost:8080")
        .matchHeader("user-agent", "custom-agent")
        .get("/foo")
        .reply(200, "derp");

      sinon.spy(request, "create");
      this.fn.resolves({});

      const headers = {'user-agent': 'test'};

      const options =  {
        url: "http://localhost:8080/foo",
        cookies: false,
        headers: {
          'user-agent': "custom-agent",
        },
      };

      return request.sendStream(headers, this.fn, options)
      .then(function(beginFn) {
        beginFn();
        expect(request.create).to.be.calledOnce;
        return expect(request.create).to.be.calledWith(options);
      });
    });

    return it("gets + attaches the cookies at each redirect", function() {
      return testAttachingCookiesWith(() => {
        return request.sendStream({}, this.fn, {
          url: "http://localhost:1234/",
          followRedirect: _.stubTrue
        })
        .then(fn => {
          const req = fn();

          return new Promise((resolve, reject) => {
            req.on('response', resolve);
            return req.on('error', reject);
          });
        });
      });
    });
  });
});
