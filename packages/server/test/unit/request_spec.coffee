require("../spec_helper")

_       = require("lodash")
http    = require("http")
Request = require("#{root}lib/request")

request = Request({timeout: 100})

describe "lib/request", ->
  it "is defined", ->
    expect(request).to.be.an("object")

  context "#reduceCookieToArray", ->
    it "converts object to array of key values", ->
      obj = {
        foo: "bar"
        baz: "quux"
      }

      expect(request.reduceCookieToArray(obj)).to.deep.eq(["foo=bar", "baz=quux"])

  context "#getDelayForRetry", ->
    it "divides by 10 when delay >= 1000 and err.code = ECONNREFUSED", ->
      retryIntervals = [1,2,3,4]
      delaysRemaining = [0, 999, 1000, 2000]

      err = {
        code: "ECONNREFUSED"
      }

      onNext = sinon.stub()

      retryIntervals.forEach ->
        request.getDelayForRetry({
          err,
          onNext,
          retryIntervals,
          delaysRemaining,
        })

      expect(delaysRemaining).to.be.empty
      expect(onNext.args).to.deep.eq([
        [0, 1]
        [999, 2]
        [100, 3]
        [200, 4]
      ])

    it "does not divide by 10 when err.code != ECONNREFUSED", ->
      retryIntervals = [1,2,3,4]
      delaysRemaining = [2000, 2000, 2000, 2000]

      err = {
        code: "ECONNRESET"
      }

      onNext = sinon.stub()

      request.getDelayForRetry({
        err,
        onNext,
        retryIntervals,
        delaysRemaining,
      })

      expect(delaysRemaining).to.have.length(3)
      expect(onNext).to.be.calledWith(2000, 1)

    it "calls onElse when delaysRemaining is exhausted", ->
      retryIntervals = [1,2,3,4]
      delaysRemaining = []

      onNext = sinon.stub()
      onElse = sinon.stub()

      request.getDelayForRetry({
        onElse
        onNext,
        retryIntervals,
        delaysRemaining,
      })

      expect(onElse).to.be.calledWithExactly()
      expect(onNext).not.to.be.called

  context "#setDefaults", ->
    it "delaysRemaining to retryIntervals clone", ->
      retryIntervals = [1,2,3,4]

      opts = request.setDefaults({ retryIntervals })

      expect(opts.retryIntervals).to.eq(retryIntervals)
      expect(opts.delaysRemaining).not.to.eq(retryIntervals)
      expect(opts.delaysRemaining).to.deep.eq(retryIntervals)

    it "retryIntervals to [0, 1000, 2000, 2000] by default", ->
      opts = request.setDefaults({})

      expect(opts.retryIntervals).to.deep.eq([0, 1000, 2000, 2000])

    it "delaysRemaining can be overridden", ->
      delaysRemaining = [1]
      opts = request.setDefaults({ delaysRemaining })

      expect(opts.delaysRemaining).to.eq(delaysRemaining)

  context "#createCookieString", ->
    it "joins array by '; '", ->
      obj = {
        foo: "bar"
        baz: "quux"
      }

      expect(request.createCookieString(obj)).to.eq("foo=bar; baz=quux")

  context "#normalizeResponse", ->
    beforeEach ->
      @push = sinon.stub()

    it "sets status to statusCode and deletes statusCode", ->
      expect(request.normalizeResponse(@push, {
        statusCode: 404
        request: {
          headers: {foo: "bar"}
          body: "body"
        }
      })).to.deep.eq({
        status: 404
        statusText: "Not Found"
        isOkStatusCode: false
        requestHeaders: {foo: "bar"}
        requestBody: "body"
      })

      expect(@push).to.be.calledOnce

    it "picks out status body and headers", ->
      expect(request.normalizeResponse(@push, {
        foo: "bar"
        req: {}
        originalHeaders: {}
        headers: {"Content-Length": 50}
        body: "<html>foo</html>"
        statusCode: 200
        request: {
          headers: {foo: "bar"}
          body: "body"
        }
      })).to.deep.eq({
        body: "<html>foo</html>"
        headers: {"Content-Length": 50}
        status: 200
        statusText: "OK"
        isOkStatusCode: true
        requestHeaders: {foo: "bar"}
        requestBody: "body"
      })

      expect(@push).to.be.calledOnce

  context "#create", ->
    beforeEach (done) ->
      @hits = 0

      @srv = http.createServer (req, res) =>
        @hits++

        switch req.url
          when "/never-ends"
            res.writeHead(200)
            res.write("foo\n")
          when "/econnreset"
            req.socket.destroy()

      @srv.listen(9988, done)

    afterEach ->
      @srv.close()

    context "retries for streams", ->
      it "does not retry on a timeout", (done) ->
        opts = request.setDefaults({
          url: "http://localhost:9988/never-ends"
          timeout: 100
        })

        stream = request.create(opts)

        retries = 0

        stream.on "retry", ->
          retries++

        stream.on "error", (err) ->
          expect(err.code).to.eq('ESOCKETTIMEDOUT')
          expect(retries).to.eq(0)
          done()

      it "retries 4x on a connection reset", (done) ->
        opts = {
          url: "http://localhost:9988/econnreset"
          retryIntervals: [0, 1, 2, 3]
          timeout: 250
        }

        stream = request.create(opts)

        retries = 0

        stream.on "retry", ->
          retries++

        stream.on "error", (err) ->
          expect(err.code).to.eq('ECONNRESET')
          expect(retries).to.eq(4)
          done()

      it "retries 4x on a NXDOMAIN (ENOTFOUND)", (done) ->
        nock.enableNetConnect()

        opts = {
          url: "http://will-never-exist.invalid.example.com"
          retryIntervals: [0, 1, 2, 3]
        }

        stream = request.create(opts)

        retries = 0

        stream.on "retry", ->
          retries++

        stream.on "error", (err) ->
          expect(err.code).to.eq('ENOTFOUND')
          expect(retries).to.eq(4)
          done()

    context "retries for promises", ->
      it "does not retry on a timeout", ->
        opts = {
          url: "http://localhost:9988/never-ends"
          timeout: 100
        }

        request.create(opts, true)
        .then ->
          throw new Error('should not reach')
        .catch (err) =>
          expect(err.error.code).to.eq('ESOCKETTIMEDOUT')
          expect(@hits).to.eq(1)

      it "retries 4x on a connection reset", ->
        opts = {
          url: "http://localhost:9988/econnreset"
          retryIntervals: [0, 1, 2, 3]
          timeout: 250
        }

        request.create(opts, true)
        .then ->
          throw new Error('should not reach')
        .catch (err) =>
          expect(err.error.code).to.eq('ECONNRESET')
          expect(@hits).to.eq(5)

  context "#sendPromise", ->
    beforeEach ->
      @fn = sinon.stub()

    it "sets strictSSL=false", ->
      init = sinon.spy(request.rp.Request.prototype, "init")

      nock("http://www.github.com")
      .get("/foo")
      .reply 200, "hello", {
        "Content-Type": "text/html"
      }

      request.sendPromise({}, @fn, {
        url: "http://www.github.com/foo"
        cookies: false
      })
      .then ->
        expect(init).to.be.calledWithMatch({strictSSL: false})

    it "sets simple=false", ->
      nock("http://www.github.com")
      .get("/foo")
      .reply(500, "")

      ## should not bomb on 500
      ## because simple = false
      request.sendPromise({}, @fn, {
        url: "http://www.github.com/foo"
        cookies: false
      })

    it "sets resolveWithFullResponse=true", ->
      nock("http://www.github.com")
      .get("/foo")
      .reply(200, "hello", {
        "Content-Type": "text/html"
      })

      request.sendPromise({}, @fn, {
        url: "http://www.github.com/foo"
        cookies: false
        body: "foobarbaz"
      })
      .then (resp) ->
        expect(resp).to.have.keys("status", "body", "headers", "duration", "isOkStatusCode", "statusText", "allRequestResponses", "requestBody", "requestHeaders")

        expect(resp.status).to.eq(200)
        expect(resp.statusText).to.eq("OK")
        expect(resp.body).to.eq("hello")
        expect(resp.headers).to.deep.eq({"content-type": "text/html"})
        expect(resp.isOkStatusCode).to.be.true
        expect(resp.requestBody).to.eq("foobarbaz")
        expect(resp.requestHeaders).to.deep.eq({
          "accept": "*/*"
          "accept-encoding": "gzip, deflate"
          "connection": "keep-alive"
          "content-length": 9
          "host": "www.github.com"
        })
        expect(resp.allRequestResponses).to.deep.eq([
          {
            "Request Body":     "foobarbaz"
            "Request Headers":  {"accept": "*/*", "accept-encoding": "gzip, deflate", "connection": "keep-alive", "content-length": 9, "host": "www.github.com"}
            "Request URL":      "http://www.github.com/foo"
            "Response Body":    "hello"
            "Response Headers": {"content-type": "text/html"}
            "Response Status":  200
          }
        ])

    it "includes redirects", ->
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
      })

      request.sendPromise({}, @fn, {
        url: "http://www.github.com/dashboard"
        cookies: false
      })
      .then (resp) ->
        expect(resp).to.have.keys("status", "body", "headers", "duration", "isOkStatusCode", "statusText", "allRequestResponses", "redirects", "requestBody", "requestHeaders")

        expect(resp.status).to.eq(200)
        expect(resp.statusText).to.eq("OK")
        expect(resp.body).to.eq("log in")
        expect(resp.headers).to.deep.eq({"content-type": "text/html"})
        expect(resp.isOkStatusCode).to.be.true
        expect(resp.requestBody).to.be.undefined
        expect(resp.redirects).to.deep.eq([
          "301: http://www.github.com/auth"
          "302: http://www.github.com/login"
        ])
        expect(resp.requestHeaders).to.deep.eq({
          "accept": "*/*"
          "accept-encoding": "gzip, deflate"
          "connection": "keep-alive"
          "referer": "http://www.github.com/auth"
          "host": "www.github.com"
        })
        expect(resp.allRequestResponses).to.deep.eq([
          {
            "Request Body":     null
            "Request Headers":  {"accept": "*/*", "accept-encoding": "gzip, deflate", "connection": "keep-alive", "host": "www.github.com"}
            "Request URL":      "http://www.github.com/dashboard"
            "Response Body":    null
            "Response Headers": {"location": "/auth"}
            "Response Status":  301
          }, {
            "Request Body":     null
            "Request Headers":  {"accept": "*/*", "accept-encoding": "gzip, deflate", "connection": "keep-alive", "host": "www.github.com", "referer": "http://www.github.com/dashboard"}
            "Request URL":      "http://www.github.com/auth"
            "Response Body":    null
            "Response Headers": {"location": "/login"}
            "Response Status":  302
          }, {
            "Request Body":     null
            "Request Headers":  {"accept": "*/*", "accept-encoding": "gzip, deflate", "connection": "keep-alive", "host": "www.github.com", "referer": "http://www.github.com/auth"}
            "Request URL":      "http://www.github.com/login"
            "Response Body":    "log in"
            "Response Headers": {"content-type": "text/html"}
            "Response Status":  200
          }
        ])

    it "sends Cookie header, and body", ->
      nock("http://localhost:8080")
      .matchHeader("Cookie", "foo=bar; baz=quux")
      .post("/users", {
        first: "brian"
        last: "mann"
      })
      .reply(200, {id: 1})

      request.sendPromise({}, @fn, {
        url: "http://localhost:8080/users"
        method: "POST"
        cookies: {foo: "bar", baz: "quux"}
        json: true
        body: {
          first: "brian"
          last: "mann"
        }
      })
      .then (resp) ->
        expect(resp.status).to.eq(200)
        expect(resp.body.id).to.eq(1)

    it "catches errors", ->
      nock.enableNetConnect()

      req = Request({ timeout: 2000 })

      req.sendPromise({}, @fn, {
        url: "http://localhost:1111/foo"
        cookies: false
      })
      .then ->
        throw new Error("should have failed but didnt")
      .catch (err) ->
        expect(err.message).to.eq("Error: connect ECONNREFUSED 127.0.0.1:1111")

    it "parses response body as json if content-type application/json response headers", ->
      nock("http://localhost:8080")
      .get("/status.json")
      .reply(200, JSON.stringify({status: "ok"}), {
        "Content-Type": "application/json"
      })

      request.sendPromise({}, @fn, {
        url: "http://localhost:8080/status.json"
        cookies: false
      })
      .then (resp) ->
        expect(resp.body).to.deep.eq({status: "ok"})

    it "revives from parsing bad json", ->
      nock("http://localhost:8080")
      .get("/status.json")
      .reply(200, "{bad: 'json'}", {
        "Content-Type": "application/json"
      })

      request.sendPromise({}, @fn, {
        url: "http://localhost:8080/status.json"
        cookies: false
      })
      .then (resp) ->
        expect(resp.body).to.eq("{bad: 'json'}")

    it "sets duration on response", ->
      nock("http://localhost:8080")
      .get("/foo")
      .delay(10)
      .reply(200, "123", {
        "Content-Type": "text/plain"
      })

      request.sendPromise({}, @fn, {
        url: "http://localhost:8080/foo"
        cookies: false
      })
      .then (resp) ->
        expect(resp.duration).to.be.a("Number")
        expect(resp.duration).to.be.gt(0)

    it "sends up user-agent headers", ->
      nock("http://localhost:8080")
      .matchHeader("user-agent", "foobarbaz")
      .get("/foo")
      .reply(200, "derp")

      headers = {}
      headers["user-agent"] = "foobarbaz"

      request.sendPromise(headers, @fn, {
        url: "http://localhost:8080/foo"
        cookies: false
      })
      .then (resp) ->
        expect(resp.body).to.eq("derp")

    it "sends connection: keep-alive by default", ->
      nock("http://localhost:8080")
      .matchHeader("connection", "keep-alive")
      .get("/foo")
      .reply(200, "it worked")

      request.sendPromise({}, @fn, {
        url: "http://localhost:8080/foo"
        cookies: false
      })
      .then (resp) ->
        expect(resp.body).to.eq("it worked")

    it "lower cases headers", ->
      nock("http://localhost:8080")
      .matchHeader("test", "true")
      .get("/foo")
      .reply(200, "derp")

      headers = {}
      headers["user-agent"] = "foobarbaz"

      request.sendPromise(headers, @fn, {
        url: "http://localhost:8080/foo"
        cookies: false,
        headers: {
          'TEST': true,
        }
      })
      .then (resp) ->
        expect(resp.body).to.eq("derp")

    it "allows overriding user-agent in headers", ->
      nock("http://localhost:8080")
      .matchHeader("user-agent", "custom-agent")
      .get("/foo")
      .reply(200, "derp")

      headers = {'user-agent': 'test'}

      request.sendPromise(headers, @fn, {
        url: "http://localhost:8080/foo"
        cookies: false,
        headers: {
          'User-Agent': "custom-agent",
        },
      })
      .then (resp) ->
        expect(resp.body).to.eq("derp")

    context "accept header", ->
      it "sets to */* by default", ->
        nock("http://localhost:8080")
        .matchHeader("accept", "*/*")
        .get("/headers")
        .reply(200)

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/headers"
          cookies: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)

      it "can override accept header", ->
        nock("http://localhost:8080")
        .matchHeader("accept", "text/html")
        .get("/headers")
        .reply(200)

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/headers"
          cookies: false
          headers: {
            accept: "text/html"
          }
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)

      it "can override Accept header", ->
        nock("http://localhost:8080")
        .matchHeader("accept", "text/plain")
        .get("/headers")
        .reply(200)

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/headers"
          cookies: false
          headers: {
            Accept: "text/plain"
          }
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)

    context "qs", ->
      it "can accept qs", ->
        nock("http://localhost:8080")
        .get("/foo?bar=baz&q=1")
        .reply(200)

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/foo"
          cookies: false
          qs: {
            bar: "baz"
            q: 1
          }
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)

    context "followRedirect", ->
      it "by default follow redirects", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "http://localhost:8080/login"
        })
        .get("/login")
        .reply(200, "login")

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
          followRedirect: true
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp.body).to.eq("login")
          expect(resp).not.to.have.property("redirectedToUrl")

      it "follows non-GET redirects by default", ->
        nock("http://localhost:8080")
        .post("/login")
        .reply(302, "", {
          location: "http://localhost:8080/dashboard"
        })
        .get("/dashboard")
        .reply(200, "dashboard")

        request.sendPromise({}, @fn, {
          method: "POST"
          url: "http://localhost:8080/login"
          cookies: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp.body).to.eq("dashboard")
          expect(resp).not.to.have.property("redirectedToUrl")

      it "can turn off following redirects", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "http://localhost:8080/login"
        })
        .get("/login")
        .reply(200, "login")

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
          followRedirect: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(302)
          expect(resp.body).to.eq("")
          expect(resp.redirectedToUrl).to.eq("http://localhost:8080/login")

      it "resolves redirectedToUrl on relative redirects", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "/login" ## absolute-relative pathname
        })
        .get("/login")
        .reply(200, "login")

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
          followRedirect: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(302)
          expect(resp.redirectedToUrl).to.eq("http://localhost:8080/login")

      it "resolves redirectedToUrl to another domain", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(301, "", {
          location: "https://www.google.com/login"
        })
        .get("/login")
        .reply(200, "login")

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
          followRedirect: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(301)
          expect(resp.redirectedToUrl).to.eq("https://www.google.com/login")

      it "does not included redirectedToUrl when following redirects", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "http://localhost:8080/login"
        })
        .get("/login")
        .reply(200, "login")

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp).not.to.have.property("redirectedToUrl")

    context "form=true", ->
      beforeEach ->
        nock("http://localhost:8080")
        .matchHeader("Content-Type", "application/x-www-form-urlencoded")
        .post("/login", "foo=bar&baz=quux")
        .reply(200, "<html></html>")

      it "takes converts body to x-www-form-urlencoded and sets header", ->
        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/login"
          method: "POST"
          cookies: false
          form: true
          body: {
            foo: "bar"
            baz: "quux"
          }
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp.body).to.eq("<html></html>")

      it "does not send body", ->
        init = sinon.spy(request.rp.Request.prototype, "init")

        body =  {
          foo: "bar"
          baz: "quux"
        }

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/login"
          method: "POST"
          cookies: false
          form: true
          json: true
          body: body
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp.body).to.eq("<html></html>")
          expect(init).not.to.be.calledWithMatch({body: body})

      it "does not set json=true", ->
        init = sinon.spy(request.rp.Request.prototype, "init")

        request.sendPromise({}, @fn, {
          url: "http://localhost:8080/login"
          method: "POST"
          cookies: false
          form: true
          json: true
          body: {
            foo: "bar"
            baz: "quux"
          }
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp.body).to.eq("<html></html>")
          expect(init).not.to.be.calledWithMatch({json: true})

    context "bad headers", ->
      beforeEach (done) ->
        @srv = http.createServer (req, res) ->
          res.writeHead(200)
          res.end()

        @srv.listen(9988, done)

      afterEach ->
        @srv.close()

      it "recovers from bad headers", ->
        request.sendPromise({}, @fn, {
          url: "http://localhost:9988/foo"
          cookies: false
          headers: {
            "x-text": "אבגד"
          }
        })
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq "TypeError: The header content contains invalid characters"

      it "handles weird content in the body just fine", ->
        request.sendPromise({}, @fn, {
          url: "http://localhost:9988/foo"
          cookies: false
          json: true
          body: {
            "x-text": "אבגד"
          }
        })

  context "#sendStream", ->
    beforeEach ->
      @fn = sinon.stub()

    it "allows overriding user-agent in headers", ->
      nock("http://localhost:8080")
        .matchHeader("user-agent", "custom-agent")
        .get("/foo")
        .reply(200, "derp")

      sinon.spy(request, "create")
      @fn.resolves({})

      headers = {'user-agent': 'test'}

      options =  {
        url: "http://localhost:8080/foo"
        cookies: false,
        headers: {
          'user-agent': "custom-agent",
        },
      }

      request.sendStream(headers, @fn, options)
      .then (beginFn) ->
        beginFn()
        expect(request.create).to.be.calledOnce
        expect(request.create).to.be.calledWith(options)
