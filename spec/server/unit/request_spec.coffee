require("../spec_helper")

Request = require("#{root}lib/request")

describe.only "Request", ->
  it "is defined", ->
    expect(Request).to.be.an("object")

  context "#reduceCookieToArray", ->
    it "converts object to array of key values", ->
      obj = {
        foo: "bar"
        baz: "quux"
      }

      expect(Request.reduceCookieToArray(obj)).to.deep.eq(["foo=bar", "baz=quux"])

  context "#createCookieString", ->
    it "joins array by '; '", ->
      obj = {
        foo: "bar"
        baz: "quux"
      }

      expect(Request.createCookieString(obj)).to.eq("foo=bar; baz=quux")

  context "#normalizeResponse", ->
    it "sets status to statusCode and deletes statusCode", ->
      expect(Request.normalizeResponse({statusCode: 404})).to.deep.eq({
        status: 404
      })

    it "picks out status body and headers", ->
      expect(Request.normalizeResponse({
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
    it "sets simple=false", (done) ->
      nock("http://www.github.com")
        .get("/foo")
        .reply 500, ""

      ## should not bomb on 500
      ## because simple = false
      Request.send({url: "http://www.github.com/foo"}).then -> done()

    it "sets resolveWithFullResponse=true", ->
      nock("http://www.github.com")
        .get("/foo")
        .reply 200, "hello", {
          "Content-Type": "text/html"
        }

      Request.send({url: "http://www.github.com/foo"}).then (resp) ->
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

      Request.send({
        url: "http://localhost:8080/users"
        method: "POST"
        cookies: {foo: "bar", baz: "quux"}
        json: true
        body: {
          first: "brian"
          last: "mann"
        }
      }).then (resp) ->
        expect(resp.status).to.eq(200)
        expect(resp.body.id).to.eq(1)

    it "parses response body as json if content-type application/json response headers", ->
      nock("http://localhost:8080")
        .get("/status.json")
        .reply(200, JSON.stringify({status: "ok"}), {
          "Content-Type": "application/json"
        })

      Request.send({
        url: "http://localhost:8080/status.json"
      }).then (resp) ->
        expect(resp.body).to.deep.eq({status: "ok"})

    it "revives from parsing bad json", ->
      nock("http://localhost:8080")
        .get("/status.json")
        .reply(200, "{bad: 'json'}", {
          "Content-Type": "application/json"
        })

      Request.send({
        url: "http://localhost:8080/status.json"
      }).then (resp) ->
        expect(resp.body).to.eq("{bad: 'json'}")

    it "sets duration on response", ->
      nock("http://localhost:8080")
        .get("/foo")
        .reply(200, "123", {
          "Content-Type": "text/plain"
        })

      Request.send({
        url: "http://localhost:8080/foo"
      }).then (resp) ->
        expect(resp.duration).to.be.a("Number")
        expect(resp.duration).to.be.gt(1)
