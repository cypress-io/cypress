require("../spec_helper")

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

  context "#createCookieString", ->
    it "joins array by '; '", ->
      obj = {
        foo: "bar"
        baz: "quux"
      }

      expect(request.createCookieString(obj)).to.eq("foo=bar; baz=quux")

  context "#normalizeResponse", ->
    it "sets status to statusCode and deletes statusCode", ->
      expect(request.normalizeResponse({statusCode: 404})).to.deep.eq({
        status: 404
      })

    it "picks out status body and headers", ->
      expect(request.normalizeResponse({
        foo: "bar"
        req: {}
        originalHeaders: {}
        headers: {"Content-Length": 50}
        body: "<html>foo</html>"
        statusCode: 200
      })).to.deep.eq({
        body: "<html>foo</html>"
        headers: {"Content-Length": 50}
        status: 200
      })

  context "#send", ->
    beforeEach ->
      @fn = @sandbox.stub()

    it "sets strictSSL=false", ->
      init = @sandbox.spy(request.rp.Request.prototype, "init")

      nock("http://www.github.com")
      .get("/foo")
      .reply 200, "hello", {
        "Content-Type": "text/html"
      }

      request.send({}, @fn, {
        url: "http://www.github.com/foo"
        cookies: false
      })
      .then ->
        expect(init).to.be.calledWithMatch({strictSSL: false})

    it "sets simple=false", (done) ->
      nock("http://www.github.com")
      .get("/foo")
      .reply(500, "")

      ## should not bomb on 500
      ## because simple = false
      request.send({}, @fn, {
        url: "http://www.github.com/foo"
        cookies: false
      })
      .then -> done()

    it "sets resolveWithFullResponse=true", ->
      nock("http://www.github.com")
      .get("/foo")
      .reply 200, "hello", {
        "Content-Type": "text/html"
      }

      request.send({}, @fn, {
        url: "http://www.github.com/foo"
        cookies: false
      })
      .then (resp) ->
        expect(resp).to.have.keys("status", "body", "headers", "duration")

        expect(resp.status).to.eq(200)
        expect(resp.body).to.eq("hello")
        expect(resp.headers).to.deep.eq({"content-type": "text/html"})

    it "sends Cookie header, and body", ->
      nock("http://localhost:8080")
      .matchHeader("Cookie", "foo=bar; baz=quux")
      .post("/users", {
        first: "brian"
        last: "mann"
      })
      .reply(200, {id: 1})

      request.send({}, @fn, {
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

    it "retrieves cookies from automation when cookies true", ->
      nock("http://localhost:8080")
      .matchHeader("Cookie", "foo=bar; baz=quux")
      .post("/users", {
        first: "brian"
        last: "mann"
      })
      .reply(200, {id: 1})

      @fn.withArgs("get:cookies", {url: "http://localhost:8080/users"})
      .resolves([
        {name: "foo", value: "bar"}
        {name: "baz", value: "quux"}
      ])

      request.send({}, @fn, {
        url: "http://localhost:8080/users"
        method: "POST"
        cookies: true
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

      request.send({}, @fn, {
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

      request.send({}, @fn, {
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

      request.send({}, @fn, {
        url: "http://localhost:8080/status.json"
        cookies: false
      })
      .then (resp) ->
        expect(resp.body).to.eq("{bad: 'json'}")

    it "sets duration on response", ->
      nock("http://localhost:8080")
      .get("/foo")
      .reply(200, "123", {
        "Content-Type": "text/plain"
      })

      request.send({}, @fn, {
        url: "http://localhost:8080/foo"
        cookies: false
      })
      .then (resp) ->
        expect(resp.duration).to.be.a("Number")
        expect(resp.duration).to.be.gt(0)

    it "sends up user-agent headers", ->
      nock("http://localhost:8080")
      .matchHeader("User-Agent", "foobarbaz")
      .get("/foo")
      .reply(200, "derp")

      headers = {}
      headers["user-agent"] = "foobarbaz"

      request.send(headers, @fn, {
        url: "http://localhost:8080/foo"
        cookies: false
      })
      .then (resp) ->
        expect(resp.body).to.eq("derp")

    context "qs", ->
      it "can accept qs", ->
        nock("http://localhost:8080")
        .get("/foo?bar=baz&q=1")
        .reply(200)

        request.send({}, @fn, {
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

        request.send({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
          followRedirect: true
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp.body).to.eq("login")
          expect(resp).not.to.have.property("redirectedTo")

      it "follows non-GET redirects by default", ->
        nock("http://localhost:8080")
        .post("/login")
        .reply(302, "", {
          location: "http://localhost:8080/dashboard"
        })
        .get("/dashboard")
        .reply(200, "dashboard")

        request.send({}, @fn, {
          method: "POST"
          url: "http://localhost:8080/login"
          cookies: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp.body).to.eq("dashboard")
          expect(resp).not.to.have.property("redirectedTo")

      it "can turn off following redirects", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "http://localhost:8080/login"
        })
        .get("/login")
        .reply(200, "login")

        request.send({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
          followRedirect: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(302)
          expect(resp.body).to.eq("")
          expect(resp.redirectedTo).to.eq("http://localhost:8080/login")

      it "resolves redirectedTo on relative redirects", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "/login" ## absolute-relative pathname
        })
        .get("/login")
        .reply(200, "login")

        request.send({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
          followRedirect: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(302)
          expect(resp.redirectedTo).to.eq("http://localhost:8080/login")

      it "resolves redirectedTo to another domain", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(301, "", {
          location: "https://www.google.com/login"
        })
        .get("/login")
        .reply(200, "login")

        request.send({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
          followRedirect: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(301)
          expect(resp.redirectedTo).to.eq("https://www.google.com/login")

      it "does not included redirectedTo when following redirects", ->
        nock("http://localhost:8080")
        .get("/dashboard")
        .reply(302, "", {
          location: "http://localhost:8080/login"
        })
        .get("/login")
        .reply(200, "login")

        request.send({}, @fn, {
          url: "http://localhost:8080/dashboard"
          cookies: false
        })
        .then (resp) ->
          expect(resp.status).to.eq(200)
          expect(resp).not.to.have.property("redirectedTo")

    context "form=true", ->
      beforeEach ->
        nock("http://localhost:8080")
        .matchHeader("Content-Type", "application/x-www-form-urlencoded")
        .post("/login", "foo=bar&baz=quux")
        .reply(200, "<html></html>")

      it "takes converts body to x-www-form-urlencoded and sets header", ->
        request.send({}, @fn, {
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
        init = @sandbox.spy(request.rp.Request.prototype, "init")

        body =  {
          foo: "bar"
          baz: "quux"
        }

        request.send({}, @fn, {
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
        init = @sandbox.spy(request.rp.Request.prototype, "init")

        request.send({}, @fn, {
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
        request.send({}, @fn, {
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
        request.send({}, @fn, {
          url: "http://localhost:9988/foo"
          cookies: false
          json: true
          body: {
            "x-text": "אבגד"
          }
        })
