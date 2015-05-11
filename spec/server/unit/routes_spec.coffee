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
        .log(console.log)
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

    context "redirects", ->
      ## this simulates being handed back a header.location of '/'
      it "requests FQDN remoteHost when provided a relative location header", (done) ->
        nock("http://getbootstrap.com")
          .get("/")
          .reply 302, undefined, {
            "Location": "/"
          }
          .get("/")
          .reply 200, "<html></html", {
            "Content-Type": "text/html"
          }

        @session
          .get("/")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://getbootstrap.com")
          .expect(302)
          .expect "set-cookie", /remoteHost=.+getbootstrap\.com/
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

      it "sends back initial_500 content", (done) ->
        nock(@baseUrl)
          .get("/index.html")
          .reply(500)

        supertest(@app)
          .get("/index.html")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
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
      it "forwards headers on outgoing requests", (done) ->
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

      it "omits forwarding host header", (done) ->
        nock(@baseUrl)
        .matchHeader "host", (val) ->
          val isnt "demo.com"
        .get("/bar")
        .reply 200, "hello from bar!", {
          "Content-Type": "text/html"
        }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .set("host", "demo.com")
          .expect(200, "hello from bar!")
          .end(done)

      it "omits forwarding accept-encoding", (done) ->
        nock(@baseUrl)
        .matchHeader "accept-encoding", (val) ->
          val isnt "foo"
        .get("/bar")
        .reply 200, "hello from bar!", {
          "Content-Type": "text/html"
        }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .set("host", "demo.com")
          .set("accept-encoding", "foo")
          .expect(200, "hello from bar!")
          .end(done)

      it "omits forwarding accept-language", (done) ->
        nock(@baseUrl)
        .matchHeader "accept-language", (val) ->
          val isnt "utf-8"
        .get("/bar")
        .reply 200, "hello from bar!", {
          "Content-Type": "text/html"
        }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .set("host", "demo.com")
          .set("accept-language", "utf-8")
          .expect(200, "hello from bar!")
          .end(done)

    context "absolute url rewriting", ->
      it "rewrites anchor href", (done) ->
        nock(@baseUrl)
          .log(console.log)
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

      it "rewrites multiple anchors", (done) ->
        contents = removeWhitespace Fixtures.get("server/absolute_url.html")
        expected = removeWhitespace Fixtures.get("server/absolute_url_expected.html")

        nock(@baseUrl)
          .log(console.log)
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
          rootFolder: "dev"
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
          .get("/assets/app.css")
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

      it.only "falls back to baseUrl when no FQDN and no remoteHost", (done) ->
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