root          = "../../../"
Server        = require("#{root}lib/server")
Fixtures      = require "#{root}/spec/server/helpers/fixtures"
expect        = require("chai").expect
nock          = require('nock')
sinon         = require('sinon')
supertest     = require("supertest")
Session       = require("supertest-session")
str           = require("underscore.string")
coffee        = require("coffee-script")

removeWhitespace = (c) ->
  c = str.clean(c)
  c = str.lines(c).join(" ")
  c

describe "Routes", ->
  beforeEach ->
    nock.enableNetConnect()

    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Server.prototype, "getCypressJson").returns({})

    @server = Server("/Users/brian/app")
    @server.configureApplication()

    @app    = @server.app
    @server.setCypressJson {
      projectRoot: "/Users/brian/app"
    }

    ## create a session which will store cookies
    ## in between session requests :-)
    @session = new (Session({app: @app}))

  afterEach ->
    @session.destroy()
    @sandbox.restore()
    nock.cleanAll()

  context "GET /", ->
    beforeEach ->
      @baseUrl = "http://www.github.com"

    it "redirects to config.clientRoute without a __cypress.remoteHost", (done) ->
      supertest(@app)
      .get("/")
      .expect(302)
      .expect (res) ->
        expect(res.headers.location).to.eq "/__/"
        null
      .end(done)

    it "does not redirect with __cypress.remoteHost cookie", (done) ->
      nock("http://www.github.com")
        .get("/")
        .reply(200, "<html></html>", {
          "Content-Type": "text/html"
        })

      supertest(@app)
        .get("/")
        .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
        .expect(200)
        .end(done)

  context "GET /__", ->
    it "routes config.clientRoute to serve cypress client app html", (done) ->
      supertest(@app)
        .get("/__")
        .expect(200)
        .expect(/App.start\(.+\)/)
        .end(done)

    it "omits x-powered-by", (done) ->
      supertest(@app)
        .get("/__")
        .expect(200)
        .expect (res) ->
          expect(res.headers["x-powered-by"]).not.to.exist
          null
        .end(done)

  context "GET /__cypress/id_generator", ->
    it "renders id_generator.html", (done) ->
      ## it may seem silly to use an 'expected fixture'
      ## here, but because this is such a critical component
      ## we need to "anchor" or "hard code" our expected result
      ## else our test would always pass due to any changes
      ## to the id_generator.html page.  By hard coding it
      ## we can independently verify that the content meets
      ## a rigid standard.
      contents = removeWhitespace Fixtures.get("server/id_generator_expected.html")

      supertest(@app)
        .get("/__cypress/id_generator")
        .expect(200)
        .expect (res) ->
          body = removeWhitespace(res.text)
          expect(body).to.eq contents
          null
        .end(done)

  context "GET /__cypress/files", ->
    beforeEach ->
      Fixtures.scaffold("todos")

      @server.setCypressJson {
        projectRoot: Fixtures.project("todos")
        testFolder: "tests"
      }

    afterEach ->
      Fixtures.remove("todos")

    it "returns base json file path objects", (done) ->
      supertest(@app)
        .get("/__cypress/files")
        .expect(200, [
          { name: "sub/sub_test.coffee" },
          { name: "test1.js" },
          { name: "test2.coffee" }
        ])
        .end(done)

    it "sets X-Files-Path header to the length of files", (done) ->
      filesPath = Fixtures.project("todos") + "/" + "tests"

      supertest(@app)
        .get("/__cypress/files")
        .expect(200)
        .expect("X-Files-Path", filesPath)
        .end(done)

  context "GET /__cypress/tests", ->
    describe "todos", ->
      beforeEach ->
        Fixtures.scaffold("todos")

        @server.setCypressJson {
          projectRoot: Fixtures.project("todos")
          testFolder: "tests"
          javascripts: ["support/spec_helper.coffee"]
          sinon: false
          fixtures: false
        }

      afterEach ->
        Fixtures.remove("todos")

      it "processes sub/sub_test.coffee spec", (done) ->
        file = Fixtures.get("projects/todos/tests/sub/sub_test.coffee")
        file = coffee.compile(file)

        supertest(@app)
          .get("/__cypress/tests?p=tests/sub/sub_test.coffee")
          .expect(200)
          .expect (res) ->
            expect(res.text).to.eq file
            null
          .end(done)

      it "processes support/spec_helper.coffee javascripts", (done) ->
        file = Fixtures.get("projects/todos/support/spec_helper.coffee")
        file = coffee.compile(file)

        supertest(@app)
          .get("/__cypress/tests?p=support/spec_helper.coffee")
          .expect(200)
          .expect (res) ->
            expect(res.text).to.eq file
            null
          .end(done)

    describe "no-server", ->
      beforeEach ->
        Fixtures.scaffold("no-server")

        @server.setCypressJson {
          projectRoot: Fixtures.project("no-server")
          testFolder: "my-tests"
          javascripts: ["helpers/includes.js"]
          sinon: false
          fixtures: false
        }

      afterEach ->
        Fixtures.remove("no-server")

      it "processes my-tests/test1.js spec", (done) ->
        file = Fixtures.get("projects/no-server/my-tests/test1.js")

        supertest(@app)
          .get("/__cypress/tests?p=my-tests/test1.js")
          .expect(200)
          .expect (res) ->
            expect(res.text).to.eq file
            null
          .end(done)

      it "processes helpers/includes.js javascripts", (done) ->
        file = Fixtures.get("projects/no-server/helpers/includes.js")

        supertest(@app)
          .get("/__cypress/tests?p=helpers/includes.js")
          .expect(200)
          .expect (res) ->
            expect(res.text).to.eq file
            null
          .end(done)

  context "GET /__cypress/iframes/*", ->
    describe "todos", ->
      beforeEach ->
        Fixtures.scaffold("todos")

        @server.setCypressJson {
          projectRoot: Fixtures.project("todos")
          testFolder: "tests"
          javascripts: ["support/spec_helper.coffee"]
          sinon: false
          fixtures: false
        }

      afterEach ->
        Fixtures.remove("todos")

      it "renders empty inject with variables passed in", (done) ->
        contents = removeWhitespace Fixtures.get("server/expected_empty_inject.html")

        supertest(@app)
          .get("/__cypress/iframes/test2.coffee")
          .expect(200)
          .expect (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents
            null
          .end(done)

    describe "no-server", ->
      beforeEach ->
        Fixtures.scaffold("no-server")

        @server.setCypressJson {
          projectRoot: Fixtures.project("no-server")
          testFolder: "my-tests"
          javascripts: ["helpers/includes.js"]
          ## even though there are no files here
          ## we are adding rootFolder to test that
          ## only the support files receive this value
          rootFolder: "foo"
          sinon: false
          fixtures: false
        }

      afterEach ->
        Fixtures.remove("no-server")

      it "renders empty inject with variables passed in", (done) ->
        contents = removeWhitespace Fixtures.get("server/expected_no_server_empty_inject.html")

        supertest(@app)
          .get("/__cypress/iframes/test1.js")
          .expect(200)
          .expect (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents
            null
          .end(done)

  context "GET *", ->
    beforeEach ->
      @baseUrl = "http://www.github.com"

    it "basic 200 html response", (done) ->
      nock(@baseUrl)
        .get("/")
        .reply 200, "hello from bar!", {
          "Content-Type": "text/html"
        }

      supertest(@app)
        .get("/")
        .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
        .expect(200, "hello from bar!")
        .end(done)

    context "gzip", ->
      it "does not send accept-encoding headers when initial=true", (done) ->
        nock(@baseUrl)
          .get("/gzip")
          .matchHeader "accept-encoding", (val) ->
            val isnt "gzip"
          # .replyWithFile 200, Fixtures.path("server/gzip.html.gz"), {
          #   "Content-Type": "text/html"
          #   "Content-Encoding": "gzip"
          # }
          .reply(200)

        supertest(@app)
          .get("/gzip")
          .set("Accept-Encoding", "gzip")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          # .expect(200, "<html>gzip</html>")
          .expect(200)
          .end(done)

      it "does send accept-encoding headers when initial=false", (done) ->
        nock(@baseUrl)
          .get("/gzip")
          .matchHeader "accept-encoding", "gzip"
          .reply(200)

        supertest(@app)
          .get("/gzip")
          .set("Accept-Encoding", "gzip")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .end(done)

    context "304 Not Modified", ->
      it "sends back a 304", (done) ->
        nock("http://localhost:8080")
          .get("/assets/app.js")
          .reply(304)

        supertest(@app)
          .get("/assets/app.js")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(304)
          .end(done)

    context "redirects", ->
      ## this simulates being handed back a header.location of '/'
      it "requests FQDN remoteHost when provided a relative location header", (done) ->
        nock("http://getbootstrap.com")
          .get("/foo")
          .reply 302, undefined, {
            "Location": "/"
          }
          .get("/")
          .reply 200, "<html></html", {
            "Content-Type": "text/html"
          }

        @session
          .get("/foo")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://getbootstrap.com")
          .expect(302)
          .expect "location", "/"
          .expect "set-cookie", /remoteHost=.+getbootstrap\.com/
          .end(done)

      ## our location header should be local not the external foobar.com
      it "rewrites the location header locally to our current host", (done) ->
        nock("http://foobar.com")
          .get("/css")
          .reply 302, undefined, {
            "Location": "http://foobar.com/css/"
          }

        supertest(@app)
          .get("/css")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://foobar.com")
          .expect(302)
          .expect "location", "/css/"
          .end(done)

      ## this simulates when we reach a redirect and the redirect origin
      ## matches what our current remoteHost is.  In other words, if we were
      ## to log in and be redirected to say http://localhost:8080/users/1 if
      ## that origin matches our current remoteHost of 'localhost:8080' we will
      ## just redirect to /users/1 instead of /localhost:8080/users/1
      it "redirects locally if Location header origin matches remoteHost", (done) ->
        nock("http://localhost:8080")
          .get("/login")
          .reply(302, undefined, {
            Location: "http://localhost:8080/users/1"
          })

        supertest(@app)
          .get("/login")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
          .expect(302)
          .expect "location", "/users/1"
          .end(done)

      ## this can happen when we are logging into a SSO system where the auth endpoint
      ## is on a cross domain (like auth.example.com)
      ## we first navigate to auth.example.com, and then after logging in we are 302
      ## back to (app.example.com)
      ## our remoteHost would first be http://auth.example.com and then needs to
      ## move to http://app.example.com due to the redirect
      it "redirects externally and resets remoteHost if Location header origin doesnt match remoteHost", (done) ->
        nock("http://auth.example.com")
          .get("/login")
          .reply(302, undefined, {
            Location: "http://app.example.com/users/1"
          })

        supertest(@app)
          .get("/login")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://auth.example.com")
          .expect(302)
          .expect "location", "/users/1"
          .expect "set-cookie", /initial=true/
          .expect "set-cookie", /remoteHost=.+app\.example\.com/
          .end(done)

      ## this happens when we're fetching regular content like .js or .css files on a CND
      ## if our remoteInitial isnt true then we know we're not fetching HTML content and
      ## therefore do not need to reset our remoteHost. instead we just fetch the content
      ## through our proxy using absolute-path-relative fetching
      it "doesnt reset remoteHost if remoteInitial is false and remoteHost doenst match header Location origin", (done) ->
        nock("http://cdnjs.com")
          .get("/backbone.js")
          .reply(302, undefined, {
            Location: "http://cdnjs.com/assets/backbone.js"
          })

        supertest(@app)
          .get("/http://cdnjs.com/backbone.js") ## simulate rewritten html content
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(302)
          .expect "location", "/http://cdnjs.com/assets/backbone.js"
          .expect (res) ->
            expect(res.headers).not.to.have.keys("set-cookie")
            null
          .end(done)

    context "error handling", ->
      it "status code 500", (done) ->
        nock(@baseUrl)
          .get("/index.html")
          .reply(500)

        supertest(@app)
          .get("/index.html")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(500)
          .end(done)

      ## allow nock to throw here
      it "does not send back initial_500 content on error when initial is false"

      it "sends back initial_500 content", (done) ->
        nock(@baseUrl)
          .get("/index.html")
          .reply(500, "FAIL WAIL")

        supertest(@app)
          .get("/index.html")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(500)
          .expect (res) =>
            expect(res.text).to.include("<span data-cypress-visit-error></span>")
            expect(res.text).to.include("<a href=\"#{@baseUrl}/index.html\" target=\"_blank\">#{@baseUrl}/index.html</a>")
            expect(res.text).to.include("Did you forget to start your web server?")
            null
          .end(done)

      it "sends back 500 when file does not exist locally", (done) ->
        supertest(@app)
          .get("/foo/views/test/index.html")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=<root>")
          .expect (res) =>
            expect(res.text).to.include("<span data-cypress-visit-error></span>")
            expect(res.text).to.include("file://")
            expect(res.text).to.include("This file could not be served from your file system.")
            null
          .end(done)

    context "headers", ->
      describe "when initial is true", ->
        it "sets back to false", (done) ->
          nock("http://localhost:8080")
            .get("/app.html")
            .reply 200, "OK", {
              "Content-Type" : "text/html"
            }

          supertest(@app)
            .get("/app.html")
            .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
            .expect(200)
            .expect "set-cookie", /initial=false/
            .end(done)

        it "sets remoteHost to the passed in remoteHost", (done) ->
          nock("http://localhost:8080")
            .get("/app.html")
            .reply 200, "OK", {
              "Content-Type" : "text/html"
            }

          supertest(@app)
            .get("/app.html")
            .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
            .expect(200)
            .expect "set-cookie", /remoteHost=.+localhost/
            .end(done)

      describe "when initial is false", ->
        it "does not reset initial or remoteHost", (done) ->
          nock("http://localhost:8080")
            .get("/app.html")
            .reply 200, "OK", {
              "Content-Type" : "text/html"
            }

          supertest(@app)
            .get("/app.html")
            .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
            .expect(200)
            .expect (res) ->
              ## there shouldnt be any cookies set here by us
              expect(res.headers["set-cookie"]).not.to.exist
              null
            .end(done)

      it "sends with Transfer-Encoding: chunked without Content-Length", (done) ->
        nock("http://localhost:8080")
          .get("/login")
          .reply 200, new Buffer("foo"), {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get("/login")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "foo")
          .expect("transfer-encoding", "chunked")
          .expect (res) ->
            expect(res.headers).not.to.have.keys("content-length")
            null
          .end(done)

      it "does not have Content-Length", (done) ->
        nock("http://localhost:8080")
          .get("/login")
          .reply 200, "foo", {
            "Content-Type": "text/html"
            "Content-Length": 123
          }

        supertest(@app)
          .get("/login")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "foo")
          .expect("transfer-encoding", "chunked")
          .expect (res) ->
            expect(res.headers).not.to.have.keys("content-length")
            null
          .end(done)

      it "forwards cookies from incoming responses", (done) ->
        nock("http://localhost:8080")
          .get("/login")
          .reply 200, "OK", {
            "set-cookie" : "userId=123"
          }

        supertest(@app)
          .get("/login")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200)
          .expect "set-cookie", /userId=123/
          .end(done)

      it "appends to previous cookies from incoming responses", (done) ->
        nock("http://localhost:8080")
          .get("/login")
          .reply 200, "OK", {
            "set-cookie" : "userId=123; Path=/"
          }

        supertest(@app)
          .get("/login")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
          .expect(200)
          .expect (res) ->
            expect(res.headers["set-cookie"]).to.deep.eq [
              "userId=123; Path=/"
              "__cypress.initial=false; Path=/"
              "__cypress.remoteHost=#{encodeURIComponent("http://localhost:8080")}; Path=/"
            ]
            null
          .end(done)

      it "appends cookies on redirects", (done) ->
        nock("http://localhost:8080")
          .get("/login")
          .reply 302, undefined, {
            "location": "/dashboard"
            "set-cookie" : "userId=123; Path=/"
          }

        supertest(@app)
          .get("/login")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
          .expect(302)
          .expect("location", "/dashboard")
          .expect (res) ->
            expect(res.headers["set-cookie"]).to.deep.eq [
              "userId=123; Path=/"
              "__cypress.initial=true; Path=/"
              "__cypress.remoteHost=#{encodeURIComponent("http://localhost:8080")}; Path=/"
            ]
            null
          .end(done)

      it "forwards other headers from incoming responses", (done) ->
        nock("http://localhost:8080")
          .get("/auth")
          .reply 200, "OK", {
            "x-token" : "abc-123"
          }

        supertest(@app)
          .get("/auth")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
          .expect(200)
          .expect("x-token", "abc-123")
          .end(done)

      it "forwards headers to outgoing requests", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .matchHeader("x-custom", "value")
          .reply 200, "hello from bar!", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .set("x-custom", "value")
          .expect(200, "hello from bar!")
          .end(done)

      it "omits x-frame-options", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "OK", {
            "Content-Type": "text/html"
            "x-frame-options": "SAMEORIGIN"
          }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            expect(res.headers).not.to.have.keys("x-frame-options")
            null
          .end(done)

      it "strips HttpOnly and Secure from all cookies", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "OK", {
            "Content-Type": "text/html"
            "set-cookie": [
              "user=brian; path=/; HttpOnly"
              "foo=bar; path=/"
              "token=abc-123; path=/; Secure"
            ]
          }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            expect(res.headers["set-cookie"]).to.deep.eq [
              "user=brian; path=/"
              "foo=bar; path=/"
              "token=abc-123; path=/"
            ]
            null
          .end(done)

      ## this changes the host header from being a local host (127.0.0.1)
      ## to being the host origin of the target
      ## so to the target it appears the request came from them
      it "changes the host origin to match the target", (done) ->
        nock("http://foobar.com")
          .get("/css")
          .matchHeader "host", "foobar.com"
          .reply(200)

        supertest(@app)
          .get("/css")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://foobar.com")
          .expect(200)
          .end(done)

      it "swaps out custom x-* request headers referencing our current host", (done) ->
        nock("http://localhost:8080")
          .get("/")
          .matchHeader "x-xhr-referer", "http://localhost:8080"
          .reply(200, "OK", {
            "Content-Type": "text/html"
          })

        supertest(@app)
          .get("/")
          .set("host", "http://localhost:2020")
          .set("x-xhr-referer", "http://localhost:2020")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "OK")
          .end(done)

      it "swaps out custom x-* response headers referencing the remote host", (done) ->
        nock("http://localhost:8080")
          .get("/")
          .matchHeader "x-xhr-referer", "http://localhost:8080"
          .reply(200, "OK", {
            "Content-Type": "text/html"
          })

        supertest(@app)
          .get("/")
          .set("host", "http://localhost:2020")
          .set("x-xhr-referer", "http://localhost:2020")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "OK")
          .end(done)

      it "swaps out req referer header", (done) ->
        nock("http://localhost:8080")
          .get("/foo")
          .matchHeader "referer", "http://localhost:8080"
          .reply(200, "OK", {
            "Content-Type": "text/html"
          })

        supertest(@app)
          .get("/foo")
          .set("host", "http://localhost:2020")
          .set("referer", "http://localhost:2020")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "OK")
          .end(done)

    context "content injection", ->
      it "injects sinon content into head", (done) ->
        contents = removeWhitespace Fixtures.get("server/expected_sinon_inject.html")

        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html> <head> <title>foo</title> </head> <body>hello from bar!</body> </html>", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents
            null
          .end(done)

      it "injects sinon content after following redirect", (done) ->
        contents = removeWhitespace Fixtures.get("server/expected_sinon_inject.html")

        nock(@baseUrl)
          .get("/bar")
          .reply 302, undefined, {
            ## redirect us to google.com!
            "Location": "http://www.google.com/foo"
          }
        nock("http://www.google.com")
          .get("/foo")
          .reply 200, "<html> <head> <title>foo</title> </head> <body>hello from bar!</body> </html>", {
            "Content-Type": "text/html"
          }

        @session
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(302)
          .expect "location", "/foo"
          .expect "set-cookie", /initial=true/
          .expect "set-cookie", /remoteHost=.+www\.google\.com/
          .end (err, res) =>
            return done(err) if err

            @session
              .get(res.headers.location)
              .expect(200)
              .expect "set-cookie", /initial=false/
              .expect "set-cookie", /remoteHost=.+www\.google\.com/
              .expect (res) ->
                body = removeWhitespace(res.text)
                expect(body).to.eq contents
                null
              .end(done)

      it "does not inject when not initial", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><head></head></html>", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect("<html><head></head></html>")
          .end(done)

    context "FQDN rewriting", ->
      it "does not rewrite html with not initial", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><a href='http://www.google.com'>google</a></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            body = res.text
            expect(body).to.eq "<html><body><a href='http://www.google.com'>google</a></body></html>"
            null
          .end(done)

      it "rewrites anchor href", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><a href='http://www.google.com'>google</a></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            body = res.text
            expect(body).to.eq '<html><body><a href="/http://www.google.com">google</a></body></html>'
            null
          .end(done)

      it "rewrites link tags", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><link rel='stylesheet' href='http://cdn.com/reset.css'></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            body = res.text
            expect(body).to.eq '<html><body><link rel="stylesheet" href="/http://cdn.com/reset.css"></body></html>'
            null
          .end(done)

      it "rewrites multiple elements", (done) ->
        contents = removeWhitespace Fixtures.get("server/absolute_url.html")
        expected = removeWhitespace Fixtures.get("server/absolute_url_expected.html")

        nock(@baseUrl)
          .get("/bar")
          .reply 200, contents,
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            body = res.text
            expect(body).to.eq expected
            null
          .end(done)

      it "rewrites protocol-less urls", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><link rel='stylesheet' href='//cdn.com/reset.css'></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            body = res.text
            expect(body).to.eq '<html><body><link rel="stylesheet" href="/http://cdn.com/reset.css"></body></html>'
            null
          .end(done)

      it "rewrites protocol-less forms", (done) ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><form action='//external.domain.com/bar/index.php'>form</form></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            body = res.text
            expect(body).to.eq '<html><body><form action="/http://external.domain.com/bar/index.php">form</form></body></html>'
            null
          .end(done)

      it "rewrites urls which match the remoteHost", (done)->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><a href='http://www.github.com/foo/bar'>github</a></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            body = res.text
            expect(body).to.eq '<html><body><a href="/foo/bar">github</a></body></html>'
            null
          .end(done)

    context "<root> file serving", ->
      beforeEach (done) ->
        ## we no longer server initial content from the rootFolder
        ## and it would be suggested for this project to be configured
        ## with a baseUrl of "dev/", which would automatically be
        ## appended to cy.visit("/index.html")
        @baseUrl = "/dev/index.html"

        Fixtures.scaffold("no-server")

        @server.setCypressJson {
          projectRoot: Fixtures.project("no-server")
          rootFolder: "dev-123-abc" ## we have this here to ensure we are ignoring this option
          testFolder: "my-tests"
        }

        @session
          .get(@baseUrl)
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=<root>")
          .expect(200)
          .expect(/index.html content/)
          .expect(/sinon.js/)
          .expect "set-cookie", /initial=false/
          .end(done)

      afterEach ->
        Fixtures.remove("no-server")

      it "streams from file system", (done) ->
        @session
          .get("/dev/assets/app.css")
          .expect(200, "html { color: black; }")
          .end(done)

      it "sets content-type", (done) ->
        @session
          .get("/dev/assets/app.css")
          .expect(200)
          .expect("content-type", /text\/css/)
          .end(done)

      it "disregards anything past the pathname", (done) ->
        @session
          .get("/dev/assets/app.css?foo=bar#hash")
          .expect(200, "html { color: black; }")
          .end(done)

    context "http file serving", ->
      beforeEach (done) ->
        @baseUrl = "http://getbootstrap.com"

        nock(@baseUrl)
          .get("/components")
          .reply 200, "content page", {
            "Content-Type": "text/html"
          }

        @session
          .get("/components")
          .set("Cookie", "__cypress.remoteHost=#{@baseUrl}")
          .expect(200)
          .end(done)

      it "proxies http requests", (done) ->
        nock(@baseUrl)
          .get("/assets/css/application.css")
          .reply 200, "html { color: #333 }", {
            "Content-Type": "text/css"
          }

        @session
          .get("/assets/css/application.css")
          .set("Cookie", "__cypress.remoteHost=#{@baseUrl}")
          .expect(200, "html { color: #333 }")
          .end(done)

    context "when session is already set", ->
      beforeEach (done) ->
        @baseUrl = "http://getbootstrap.com"

        ## make an initial request to set the
        ## session proxy!
        nock(@baseUrl)
          .get("/css")
          .reply 200, "css content page", {
            "Content-Type": "text/html"
          }

        @session
          .get("/css")
          .set("Cookie", "__cypress.remoteHost=#{@baseUrl}")
          .expect(200)
          .end(done)

      it "proxies to the remote session", (done) ->
        nock(@baseUrl)
          .get("/assets/css/application.css")
          .reply 200, "html { color: #333 }", {
            "Content-Type": "text/css"
          }

        @session
          .get("/assets/css/application.css")
          .set("Cookie", "__cypress.remoteHost=#{@baseUrl}")
          .expect(200, "html { color: #333 }")
          .end(done)

    context "FQDN's which were rewritten to be absolute-path-relative", ->
      ## these urls happen when we re-write FQDN path's to be
      ## absolute-path-relative, and these requests are made

      beforeEach ->
        @url = "/http://localhost:3000/about"

      it "can initially fetch content", (done) ->
        nock("http://localhost:3000")
          .get("/about")
          .reply 200, "OK", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get(@url)
          .set("Cookie", "__cypress.initial=true")
          .expect(200)
          .expect (res) ->
            expect(res.text).to.eq "OK"
            null
          .end(done)

      it "resets remoteHost to FQDN", (done) ->
        nock("http://localhost:3000")
          .get("/about")
          .reply 200, "OK", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get(@url)
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect (res) ->
            console.log res.text
          .expect(200)
          .expect "set-cookie", /remoteHost=.+localhost.+3000/
          .expect (res) ->
            expect(res.text).to.eq "OK"
            null
          .end(done)

      it "fetches remote proxy content", (done) ->
        nock("http://localhost:3000")
          .get("/app.css")
          .reply 200, "{}", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get("/http://localhost:3000/app.css")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .expect (res) ->
            expect(res.text).to.eq "{}"
            null
          .end(done)

      it "falls back to baseUrl when no FQDN and no remoteHost", (done) ->
        @server.setCypressJson({
          baseUrl: "http://www.google.com"
        })

        nock("http://www.google.com")
          .get("/app.css")
          .reply 200, "{}", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get("/app.css")
          .expect(200)
          .expect (res) ->
            expect(res.text).to.eq "{}"
            null
          .end(done)

      # it "handles protocol-less proxies", (done) ->
      #   nock("http://www.cdnjs.com")
      #     .get("backbone.js")
      #     .reply 200, "var foo;", {
      #       "Content-Type" : "text/javascript"
      #     }

      #   supertest(@app)
      #   .get("/www.cdnjs.com/backbone.js")
      #   .expect(200)
      #   .end(done)

  context "POST *", ->
    beforeEach ->
      @baseUrl = "http://localhost:8000"

    it "processes POST + redirect on remote proxy", (done) ->
      nock(@baseUrl)
        .post("/login", {
          username: "brian@cypress.io"
          password: "foobar"
        })
        .reply 302, undefined, {
          "Location": "/dashboard"
        }
        .get("/dashboard")
        .reply 200, "OK", {
          "Content-Type" : "text/html"
        }

      supertest(@app)
        .post("/login")
        .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8000")
        .type("form")
        .send({username: "brian@cypress.io", password: "foobar"})
        .expect(302)
        .expect "location", /dashboard/
        .end(done)

    ## this happens on a real form submit because beforeunload fires
    ## and initial=true gets set
    it "processes POST + redirect on remote initial", (done) ->
      nock(@baseUrl)
        .post("/login", {
          username: "brian@cypress.io"
          password: "foobar"
        })
        .reply 302, undefined, {
          "Location": "/dashboard"
        }
        .get("/dashboard")
        .reply 200, "OK", {
          "Content-Type" : "text/html"
        }

      supertest(@app)
        .post("/login")
        .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8000")
        .type("form")
        .send({username: "brian@cypress.io", password: "foobar"})
        .expect (res) ->
          console.log res.text
        # .expect(302)
        # .expect "location", /dashboard/
        .end(done)

    it "hands back 201 status codes"