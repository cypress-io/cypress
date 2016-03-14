require("../spec_helper")

_             = require("lodash")
dns           = require("dns")
http          = require("http")
glob          = require("glob")
path          = require("path")
str           = require("underscore.string")
coffee        = require("coffee-script")
Server        = require("#{root}lib/server")
CacheBuster   = require("#{root}/lib/util/cache_buster")
Fixtures      = require("#{root}/spec/server/helpers/fixtures")

## force supertest-session to use supertest-as-promised, hah
Session       = proxyquire("supertest-session", {supertest: supertest})

removeWhitespace = (c) ->
  c = str.clean(c)
  c = str.lines(c).join(" ")
  c

describe "Routes", ->
  beforeEach ->
    @sandbox.stub(CacheBuster, "get").returns("-123")

    nock.enableNetConnect()

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
    nock.cleanAll()

  context "GET /", ->
    beforeEach ->
      @baseUrl = "http://www.github.com"

    it "redirects to config.clientRoute without a __cypress.remoteHost", ->
      supertest(@app)
      .get("/")
      .expect(302)
      .then (res) ->
        expect(res.headers.location).to.eq "/__/"

    it "does not redirect with __cypress.remoteHost cookie", ->
      nock("http://www.github.com")
        .get("/")
        .reply(200, "<html></html>", {
          "Content-Type": "text/html"
        })

      supertest(@app)
        .get("/")
        .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
        .expect(200)

  context "GET /__", ->
    it "routes config.clientRoute to serve cypress client app html", ->
      supertest(@app)
        .get("/__")
        .expect(200)
        .expect(/App.start\(.+\)/)

    it "omits x-powered-by", ->
      supertest(@app)
        .get("/__")
        .expect(200)
        .then (res) ->
          expect(res.headers["x-powered-by"]).not.to.exist

  context "GET /__cypress/files", ->
    beforeEach ->
      Fixtures.scaffold("todos")

      @server.setCypressJson {
        projectRoot: Fixtures.project("todos")
        testFolder: "tests"
        fixturesFolder: "tests/_fixtures"
        javascripts: ["tests/etc/**/*"]
      }

    afterEach ->
      Fixtures.remove("todos")

    it "returns base json file path objects", (done) ->
      ## this should omit any _fixture files, _support files and javascripts

      glob path.join(Fixtures.project("todos"), "tests", "_fixtures", "**", "*"), (err, files) =>
        ## make sure there are fixtures in here!
        expect(files.length).to.be.gt(0)

        glob path.join(Fixtures.project("todos"), "tests", "_support", "**", "*"), (err, files) =>
          ## make sure there are support files in here!
          expect(files.length).to.be.gt(0)

          supertest(@app)
            .get("/__cypress/files")
            .expect(200, [
              { name: "sub/sub_test.coffee" },
              { name: "test1.js" },
              { name: "test2.coffee" }
            ])
            .then -> done()

    it "sets X-Files-Path header to the length of files", ->
      filesPath = Fixtures.project("todos") + "/" + "tests"

      supertest(@app)
        .get("/__cypress/files")
        .expect(200)
        .expect("X-Files-Path", filesPath)

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

      it "processes sub/sub_test.coffee spec", ->
        file = Fixtures.get("projects/todos/tests/sub/sub_test.coffee")
        file = coffee.compile(file)

        supertest(@app)
          .get("/__cypress/tests?p=tests/sub/sub_test.coffee")
          .expect(200)
          .then (res) ->
            expect(res.text).to.eq file

      it "processes support/spec_helper.coffee javascripts", ->
        file = Fixtures.get("projects/todos/support/spec_helper.coffee")
        file = coffee.compile(file)

        supertest(@app)
          .get("/__cypress/tests?p=support/spec_helper.coffee")
          .expect(200)
          .then (res) ->
            expect(res.text).to.eq file

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

      it "processes my-tests/test1.js spec", ->
        file = Fixtures.get("projects/no-server/my-tests/test1.js")

        supertest(@app)
          .get("/__cypress/tests?p=my-tests/test1.js")
          .expect(200)
          .then (res) ->
            expect(res.text).to.eq file

      it "processes helpers/includes.js javascripts", ->
        file = Fixtures.get("projects/no-server/helpers/includes.js")

        supertest(@app)
          .get("/__cypress/tests?p=helpers/includes.js")
          .expect(200)
          .then (res) ->
            expect(res.text).to.eq file

  context "ALL /__cypress/xhrs/*", ->
    describe "delay", ->
      it "can set delay to 10ms", ->
        delay = @sandbox.spy(Promise, "delay")

        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .set("x-cypress-delay", "10")
          .expect(200)
          .then ->
            expect(delay).to.be.calledWith(10)

      it "does not call Promise.delay when no delay", ->
        delay = @sandbox.spy(Promise, "delay")

        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .expect(200)
          .then ->
            expect(delay).not.to.be.called

    describe "status", ->
      it "can set status", ->
        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .set("x-cypress-status", "401")
          .expect(401)

    describe "headers", ->
      it "can set headers", ->
        headers = JSON.stringify({
          "x-token": "123"
          "content-type": "text/plain"
        })

        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .set("x-cypress-headers", headers)
          .expect(200)
          .expect("Content-Type", /text\/plain/)
          .expect("x-token", "123")

      it "sets headers from response type", ->
        headers = JSON.stringify({
          "x-token": "123"
        })

        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .set("x-cypress-headers", headers)
          .set("x-cypress-response", JSON.stringify({foo: "bar"}))
          .expect(200)
          .expect("Content-Type", /application\/json/)
          .expect("x-token", "123")
          .expect({foo: "bar"})

    describe "response", ->
      it "sets response to json", ->
        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .set("x-cypress-response", JSON.stringify([1,2,3]))
          .expect(200)
          .expect("Content-Type", /application\/json/)
          .expect([1,2,3])

      it "sets response to text/html", ->
        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .set("x-cypress-response", "<html>foo</html>")
          .expect(200)
          .expect("Content-Type", /text\/html/)
          .expect("<html>foo</html>")

      it "sets response to text/plain", ->
        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .set("x-cypress-response", "foobarbaz")
          .expect(200)
          .expect("Content-Type", /text\/plain/)
          .expect("foobarbaz")

      it "sets response to text/plain on empty response", ->
        supertest(@app)
          .get("/__cypress/xhrs/users/1")
          .set("x-cypress-response", "")
          .expect(200)
          .expect("Content-Type", /text\/plain/)
          .expect("")

      context "fixture", ->
        beforeEach ->
          Fixtures.scaffold("todos")

          @server.setCypressJson {
            projectRoot: Fixtures.project("todos")
            testFolder: "tests"
          }

        afterEach ->
          Fixtures.remove("todos")

        it "returns fixture contents", ->
          supertest(@app)
            .get("/__cypress/xhrs/bar")
            .set("x-cypress-response", "fixture:foo")
            .expect(200)
            .expect("Content-Type", /application\/json/)
            .expect([{json: true}])

        it "returns __error on fixture errors", ->
          supertest(@app)
            .get("/__cypress/xhrs/bar")
            .set("x-cypress-response", "fixture:bad_json")
            .expect(400)
            .expect("Content-Type", /application\/json/)
            .then (res) ->
              expect(res.body.__error).to.include("'bad_json' is not valid JSON.")

      context "PUT", ->
        it "can issue PUT requests", ->
          supertest(@app)
            .put("/__cypress/xhrs/users/1", {
              name: "brian"
            })
            .set("x-cypress-response", JSON.stringify({id: 123, name: "brian"}))
            .expect(200)
            .expect("Content-Type", /application\/json/)
            .expect({id: 123, name: "brian"})

      context "POST", ->
        it "can issue POST requests", ->
          supertest(@app)
            .post("/__cypress/xhrs/users/1", {
              name: "brian"
            })
            .set("x-cypress-response", JSON.stringify({id: 123, name: "brian"}))
            .expect(200)
            .expect("Content-Type", /application\/json/)
            .expect({id: 123, name: "brian"})

      context "HEAD", ->
        it "can issue PUT requests", ->
          supertest(@app)
            .head("/__cypress/xhrs/users/1")
            .expect(200)
            .expect("Content-Type", /text\/plain/)

      context "DELETE", ->
        it "can issue DELETE requests", ->
          supertest(@app)
            .delete("/__cypress/xhrs/users/1")
            .expect(200)
            .expect("Content-Type", /text\/plain/)

    # describe.only "maximum header size", ->
    #   ## https://github.com/cypress-io/cypress/issues/76
    #   it "does not bomb on huge headers", ->
    #     json = Fixtures.get("server/really_big_json.json")

    #     supertest(@app)
    #       .get("/__cypress/xhrs/users")
    #       .set("x-cypress-response", json)
    #       .set("x-cypress-response-2", json)
    #       .expect(200)
    #       .expect("Content-Type", /application\/json/)
    #       .expect(JSON.parse(json))

  context "GET /__cypress/iframes/*", ->
    describe "todos", ->
      beforeEach ->
        Fixtures.scaffold("todos")

        @server.setCypressJson {
          projectRoot: Fixtures.project("todos")
          testFolder: "tests"
          javascripts: ["tests/etc/etc.js"]
          sinon: false
          fixtures: false
        }

      afterEach ->
        Fixtures.remove("todos")

      it "renders empty inject with variables passed in", ->
        contents = removeWhitespace Fixtures.get("server/expected_empty_inject.html")

        supertest(@app)
          .get("/__cypress/iframes/test2.coffee")
          .expect(200)
          .then (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents

      it "can send back all tests", ->
        contents = removeWhitespace Fixtures.get("server/expected_all_tests_empty_inject.html")

        supertest(@app)
          .get("/__cypress/iframes/__all")
          .expect(200)
          .then (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents

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

      it "renders empty inject with variables passed in", ->
        contents = removeWhitespace Fixtures.get("server/expected_no_server_empty_inject.html")

        supertest(@app)
          .get("/__cypress/iframes/test1.js")
          .expect(200)
          .then (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents

  context "GET *", ->
    beforeEach ->
      @baseUrl = "http://www.github.com"

    it "basic 200 html response", ->
      nock(@baseUrl)
        .get("/")
        .reply 200, "hello from bar!", {
          "Content-Type": "text/html"
        }

      supertest(@app)
        .get("/")
        .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
        .expect(200, "hello from bar!")

    context "remoteHost", ->
      it "falls back to app __cypress.remoteHost property", ->
        @app.set("__cypress.remoteHost", "http://localhost:8080")

        nock("http://localhost:8080")
          .get("/assets/app.js")
          .reply(200, "foo")

        supertest(@app)
          .get("/assets/app.js")
          .expect(200, "foo")

      it "falls back to app baseUrl property", ->
        ## should ignore this since it has least precendence
        @app.set("__cypress.remoteHost", "http://www.github.com")

        @app.set("cypress", {baseUrl: "http://localhost:8080"})

        nock("http://localhost:8080")
          .get("/assets/app.js")
          .reply(200, "foo")

        supertest(@app)
          .get("/assets/app.js")
          .expect(200, "foo")

    context "Cache-Control: no-cache", ->
      it "does not cache initial response headers", ->
        nock("http://localhost:8080")
          .get("/")
          .reply 200, "hello from bar!", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get("/")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
          .expect(200)
          .expect("cache-control", "no-cache, no-store, must-revalidate")

    context "gzip", ->
      it "does not send accept-encoding headers when initial=true", ->
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

      it "does send accept-encoding headers when initial=false", ->
        nock(@baseUrl)
          .get("/gzip")
          .matchHeader "accept-encoding", "gzip"
          .reply(200)

        supertest(@app)
          .get("/gzip")
          .set("Accept-Encoding", "gzip")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)

      ## okay so the reason this test is valuable is the following:
      ## superagent WILL automatically decode the requests if content-encoding: gzip
      ## if our response was NOT a gzip, then it would explode
      ## because its properly gzipped then our response is unzipped and we get the
      ## normal string content.
      it "does not UNZIP gzipped responses when streaming back the response", ->
        nock(@baseUrl)
          .get("/gzip")
          .matchHeader "accept-encoding", "gzip"
          .replyWithFile 200, Fixtures.path("server/gzip.html.gz"), {
            "Content-Type": "text/html"
            "Content-Encoding": "gzip"
          }

        supertest(@app)
          .get("/gzip")
          .set("Accept-Encoding", "gzip")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200, "<html>gzip</html>")

    context "304 Not Modified", ->
      it "sends back a 304", ->
        nock("http://localhost:8080")
          .get("/assets/app.js")
          .reply(304)

        supertest(@app)
          .get("/assets/app.js")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(304)

    context "redirects", ->
      ## this simulates being handed back a header.location of '/'
      it "requests FQDN remoteHost when provided a relative location header", ->
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

      ## this fixes improper url merge where we took query params
      ## and added them needlessly
      it "doesnt redirect with query params or hashes which werent in location header", ->
        nock("http://getbootstrap.com")
          .get("/foo?bar=baz")
          .reply 302, undefined, {
            "Location": "/css"
          }
          .get("/")
          .reply 200, "<html></html", {
            "Content-Type": "text/html"
          }

        @session
          .get("/foo?bar=baz")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://getbootstrap.com")
          .expect(302)
          .expect "location", "/css"
          .expect "set-cookie", /remoteHost=.+getbootstrap\.com/

      it "does redirect with query params if location header includes them", ->
        nock("http://getbootstrap.com")
          .get("/foo?bar=baz")
          .reply 302, undefined, {
            "Location": "/css?q=search"
          }
          .get("/")
          .reply 200, "<html></html", {
            "Content-Type": "text/html"
          }

        @session
          .get("/foo?bar=baz")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://getbootstrap.com")
          .expect(302)
          .expect "location", "/css?q=search"
          .expect "set-cookie", /remoteHost=.+getbootstrap\.com/

      it "does redirect with query params to external domain if location header includes them", ->
        nock("http://getbootstrap.com")
          .get("/foo?bar=baz")
          .reply 302, undefined, {
            "Location": "https://www.google.com/search?q=cypress"
          }
          .get("/")
          .reply 200, "<html></html", {
            "Content-Type": "text/html"
          }

        @session
          .get("/foo?bar=baz")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://getbootstrap.com")
          .expect(302)
          .expect "location", "/search?q=cypress"
          .expect "set-cookie", /remoteHost=.+google\.com/

      ## our location header should be local not the external foobar.com
      it "rewrites the location header locally to our current host", ->
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

      ## this simulates when we reach a redirect and the redirect origin
      ## matches what our current remoteHost is.  In other words, if we were
      ## to log in and be redirected to say http://localhost:8080/users/1 if
      ## that origin matches our current remoteHost of 'localhost:8080' we will
      ## just redirect to /users/1 instead of /localhost:8080/users/1
      it "redirects locally if Location header origin matches remoteHost", ->
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

      ## this can happen when we are logging into a SSO system where the auth endpoint
      ## is on a cross domain (like auth.example.com)
      ## we first navigate to auth.example.com, and then after logging in we are 302
      ## back to (app.example.com)
      ## our remoteHost would first be http://auth.example.com and then needs to
      ## move to http://app.example.com due to the redirect
      it "redirects externally and resets remoteHost if Location header origin doesnt match remoteHost", ->
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

      ## this happens when we're fetching regular content like .js or .css files on a CND
      ## if our remoteInitial isnt true then we know we're not fetching HTML content and
      ## therefore do not need to reset our remoteHost. instead we just fetch the content
      ## through our proxy using absolute-path-relative fetching
      it "doesnt reset remoteHost if remoteInitial is false and remoteHost doenst match header Location origin", ->
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
          .then (res) ->
            expect(res.headers).not.to.have.keys("set-cookie")

      [301, 302, 303, 307, 308].forEach (code) =>
        it "handles direct for status code: #{code}", ->
          nock("http://auth.example.com")
            .get("/login")
            .reply(code, undefined, {
              Location: "http://app.example.com/users/1"
            })

          supertest(@app)
            .get("/login")
            .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://auth.example.com")
            .expect(302) ## we always send back a 302 instead of the original stutus code
            .expect "location", "/users/1"
            .expect "set-cookie", /initial=true/
            .expect "set-cookie", /remoteHost=.+app\.example\.com/

    context "error handling", ->
      it "status code 500", ->
        nock(@baseUrl)
          .get("/index.html")
          .reply(500)

        supertest(@app)
          .get("/index.html")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(500)

      ## allow nock to throw here
      it "does not send back initial_500 content on error when initial is false"

      it "sends back initial_500 content", ->
        nock(@baseUrl)
          .get("/index.html")
          .reply(500, "FAIL WAIL")

        supertest(@app)
          .get("/index.html")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(500)
          .then (res) =>
            expect(res.text).to.include("<span data-cypress-visit-error></span>")
            expect(res.text).to.include("<a href=\"#{@baseUrl}/index.html\" target=\"_blank\">#{@baseUrl}/index.html</a>")
            expect(res.text).to.include("Did you forget to start your web server?")

      it "sends back 500 when file does not exist locally", ->
        supertest(@app)
          .get("/foo/views/test/index.html")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=<root>")
          .expect(500)
          .then (res) =>
            expect(res.text).to.include("<span data-cypress-visit-error></span>")
            expect(res.text).to.include("file://")
            expect(res.text).to.include("This file could not be served from your file system.")

      it.only "sets x-cypress-error and x-cypress-stack headers when file does not exist", ->
        supertest(@app)
        .get("/foo/views/test/index.html")
        .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=<root>")
        .expect(500)
        .expect("x-cypress-error", /ENOENT: no such file or directory/)
        .expect("x-cypress-stack", /ENOENT: no such file or directory/)

      it "does not set x-cypress-error or x-cypress-stack when error is null", ->
        nock(@baseUrl)
        .get("/index.html")
        .reply(500, "FAIL WAIL")

        supertest(@app)
        .get("/index.html")
        .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
        .expect(500)
        .then (res) =>
          expect(res.get("x-cypress-error")).to.be.undefined
          expect(res.get("x-cypress-stack")).to.be.undefined

      it "does not send back initial 500 content on 4xx errors", ->
        nock(@baseUrl)
          .get("/index.html")
          .reply(404, "404 not found", {
            "Content-Type": "html/html"
          })

        supertest(@app)
          .get("/index.html")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(404, "404 not found")

    context "headers", ->
      describe "when unload is true", ->
        it "automatically redirects back to clientRoute", ->
          supertest(@app)
            .get("/_")
            .set("Cookie", "__cypress.unload=true; __cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
            .expect(302)
            .expect "location", "/__/"

      describe "when initial is true", ->
        it "sets back to false", ->
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

        it "sets remoteHost to the passed in remoteHost", ->
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
            .then =>
              expect(@app.get("__cypress.remoteHost")).to.eq "http://localhost:8080"

      describe "when initial is false", ->
        it "does not reset initial or remoteHost", ->
          nock("http://localhost:8080")
            .get("/app.html")
            .reply 200, "OK", {
              "Content-Type" : "text/html"
            }

          supertest(@app)
            .get("/app.html")
            .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
            .expect(200)
            .then (res) ->
              ## there shouldnt be any cookies set here by us
              expect(res.headers["set-cookie"]).not.to.exist

      it "sends with Transfer-Encoding: chunked without Content-Length", ->
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
          .then (res) ->
            expect(res.headers).not.to.have.keys("content-length")

      it "does not have Content-Length", ->
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
          .then (res) ->
            expect(res.headers).not.to.have.keys("content-length")

      it "forwards cookies from incoming responses", ->
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

      it "appends to previous cookies from incoming responses", ->
        nock("http://localhost:8080")
          .get("/login")
          .reply 200, "OK", {
            "set-cookie" : "userId=123; Path=/"
          }

        supertest(@app)
          .get("/login")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://localhost:8080")
          .expect(200)
          .then (res) ->
            expect(res.headers["set-cookie"]).to.deep.eq [
              "userId=123; Path=/"
              "__cypress.initial=false; Path=/"
              "__cypress.remoteHost=#{encodeURIComponent("http://localhost:8080")}; Path=/"
            ]

      it "appends cookies on redirects", ->
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
          .then (res) ->
            expect(res.headers["set-cookie"]).to.deep.eq [
              "userId=123; Path=/"
              "__cypress.initial=true; Path=/"
              "__cypress.remoteHost=#{encodeURIComponent("http://localhost:8080")}; Path=/"
            ]

      it "forwards other headers from incoming responses", ->
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

      it "forwards headers to outgoing requests", ->
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

      it "omits x-frame-options", ->
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
          .then (res) ->
            expect(res.headers).not.to.have.keys("x-frame-options")

      it "omits content-security-policy", ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "OK", {
            "Content-Type": "text/html"
            "content-security-policy": "foobar;"
          }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            expect(res.headers).not.to.have.keys("content-security-policy")

      it "strips HttpOnly and Secure and domain from all cookies", ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "OK", {
            "Content-Type": "text/html"
            "set-cookie": [
              "user=brian; path=/; HttpOnly"
              "foo=bar; path=/"
              "token=abc-123; path=/; Secure"
              "ssid=qwerty9999; path=/foo; domain=sevaa.link"
            ]
          }

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            expect(res.headers["set-cookie"]).to.deep.eq [
              "user=brian; path=/"
              "foo=bar; path=/"
              "token=abc-123; path=/"
              "ssid=qwerty9999; path=/foo"
            ]

      ## this changes the host header from being a local host (127.0.0.1)
      ## to being the host origin of the target
      ## so to the target it appears the request came from them
      it "changes the host origin to match the target", ->
        nock("http://foobar.com")
          .get("/css")
          .matchHeader "host", "foobar.com"
          .reply(200)

        supertest(@app)
          .get("/css")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://foobar.com")
          .expect(200)

      it "swaps out custom x-* request headers referencing our current host", ->
        nock("http://localhost:8080")
          .get("/")
          .matchHeader "x-xhr-referer", "http://localhost:8080"
          .reply(200, "OK", {
            "Content-Type": "text/html"
          })

        supertest(@app)
          .get("/")
          .set("host", "localhost:2020")
          .set("x-xhr-referer", "http://localhost:2020")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "OK")

      it "swaps out custom x-* response headers referencing the remote host", ->
        nock("http://localhost:8080")
          .get("/")
          .matchHeader "x-xhr-referer", "http://localhost:8080"
          .reply(200, "OK", {
            "Content-Type": "text/html"
          })

        supertest(@app)
          .get("/")
          .set("host", "localhost:2020")
          .set("x-xhr-referer", "http://localhost:2020")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "OK")

      it "swaps out req referer header", ->
        nock("http://localhost:8080")
          .get("/foo")
          .matchHeader "referer", "http://localhost:8080"
          .reply(200, "OK", {
            "Content-Type": "text/html"
          })

        supertest(@app)
          .get("/foo")
          .set("host", "localhost:2020") ## host headers do not include the protocol!
          .set("referer", "http://localhost:2020")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "OK")

      ## this fixes a bug where we accidentally swapped out referer with the domain of the new url
      ## when it needs to stay as the previous referring remoteHost (from our cookie)
      it "changes out the referer header with the remoteHost cookie even on a new remoteUrl", ->
        nock("http://login.google.com")
          .get("/foo")
          .matchHeader "referer", "http://localhost:8080"
          .reply(200, "OK", {
            "Content-Type": "text/html"
          })

        supertest(@app)
          .get("/http://login.google.com/foo")
          .set("host", "localhost:2020") ## host headers do not include the protocol!
          .set("referer", "http://localhost:2020")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "OK")

      it "swaps out the origin header", ->
        nock("http://localhost:8080")
          .get("/foo")
          .matchHeader "origin", "http://localhost:8080"
          .reply(200, "OK", {
            "Content-Type": "text/html"
          })

        supertest(@app)
          .get("/foo")
          .set("host", "localhost:2020") ## host headers do not include the protocol!
          .set("origin", "http://localhost:2020")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8080")
          .expect(200, "OK")

    context "content injection", ->
      it "injects sinon content into head", ->
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
          .then (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents

      it "injects when head has attributes", ->
        contents = removeWhitespace Fixtures.get("server/expected_head_inject.html")

        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html> <head prefix=\"og: foo\"> <meta name=\"foo\" content=\"bar\"> </head> <body>hello from bar!</body> </html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents

      it.skip "injects even when head tag is missing", ->
        contents = removeWhitespace Fixtures.get("server/expected_no_head_tag_inject.html")

        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html> <body>hello from bar!</body> </html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            body = removeWhitespace(res.text)
            expect(body).to.eq contents

      it "injects sinon content after following redirect", ->
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
          .then (res) =>
            @session
              .get(res.headers.location)
              .expect(200)
              .expect "set-cookie", /initial=false/
              .expect "set-cookie", /remoteHost=.+www\.google\.com/
              .then (res) ->
                body = removeWhitespace(res.text)
                expect(body).to.eq contents

      it "does not inject when not initial", ->
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

    context "FQDN rewriting", ->
      it "does not rewrite html with not initial", ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><a href='http://www.google.com'>google</a></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            body = res.text
            expect(body).to.eq "<html><body><a href='http://www.google.com'>google</a></body></html>"

      it "rewrites anchor href", ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><a href='http://www.google.com'>google</a></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            body = res.text
            expect(body).to.eq '<html><body><a href="/http://www.google.com">google</a></body></html>'

      it "rewrites link tags", ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><link rel='stylesheet' href='http://cdn.com/reset.css'></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            body = res.text
            expect(body).to.eq '<html><body><link rel="stylesheet" href="/http://cdn.com/reset.css"></body></html>'

      it "rewrites multiple elements", ->
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
          .then (res) ->
            body = res.text
            expect(body).to.eq expected

      it "rewrites protocol-less urls", ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><link rel='stylesheet' href='//cdn.com/reset.css'></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            body = res.text
            expect(body).to.eq '<html><body><link rel="stylesheet" href="/http://cdn.com/reset.css"></body></html>'

      it "rewrites protocol-less forms", ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><form action='//external.domain.com/bar/index.php'>form</form></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            body = res.text
            expect(body).to.eq '<html><body><form action="/http://external.domain.com/bar/index.php">form</form></body></html>'

      it "rewrites urls which match the remoteHost", ->
        nock(@baseUrl)
          .get("/bar")
          .reply 200, "<html><body><a href='http://www.github.com/foo/bar'>github</a></body></html>",
            "Content-Type": "text/html"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            body = res.text
            expect(body).to.eq '<html><body><a href="/foo/bar">github</a></body></html>'

      it "rewrites <svg> without hanging", ->
        ## if this test finishes without timing out we know its all good
        contents = removeWhitespace Fixtures.get("server/err_response.html")

        nock(@baseUrl)
          .get("/bar")
          .reply 200, contents,
            "Content-Type": "text/html; charset=utf-8"

        supertest(@app)
          .get("/bar")
          .set("Cookie", "__cypress.initial=true; __cypress.remoteHost=http://www.github.com")
          .expect(200)

    context "<root> file serving", ->
      beforeEach ->
        @baseUrl = "/index.html"

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
          .then =>
            expect(@app.get("__cypress.remoteHost")).to.eq "<root>"

      afterEach ->
        Fixtures.remove("no-server")

      it "streams from file system", ->
        @session
          .get("/assets/app.css")
          .expect(200, "html { color: black; }")

      it "sets content-type", ->
        @session
          .get("/assets/app.css")
          .expect(200)
          .expect("content-type", /text\/css/)

      it "disregards anything past the pathname", ->
        @session
          .get("/assets/app.css?foo=bar#hash")
          .expect(200, "html { color: black; }")

    context "http file serving", ->
      beforeEach ->
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

      it "proxies http requests", ->
        nock(@baseUrl)
          .get("/assets/css/application.css")
          .reply 200, "html { color: #333 }", {
            "Content-Type": "text/css"
          }

        @session
          .get("/assets/css/application.css")
          .set("Cookie", "__cypress.remoteHost=#{@baseUrl}")
          .expect(200, "html { color: #333 }")

    context "when session is already set", ->
      beforeEach ->
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

      it "proxies to the remote session", ->
        nock(@baseUrl)
          .get("/assets/css/application.css")
          .reply 200, "html { color: #333 }", {
            "Content-Type": "text/css"
          }

        @session
          .get("/assets/css/application.css")
          .set("Cookie", "__cypress.remoteHost=#{@baseUrl}")
          .expect(200, "html { color: #333 }")

    context "FQDN's which were rewritten to be absolute-path-relative", ->
      ## these urls happen when we re-write FQDN path's to be
      ## absolute-path-relative, and these requests are made

      beforeEach ->
        @url = "/http://localhost:3000/about"

      it "can initially fetch content", ->
        nock("http://localhost:3000")
          .get("/about")
          .reply 200, "OK", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get(@url)
          .set("Cookie", "__cypress.initial=true")
          .expect(200)
          .then (res) ->
            expect(res.text).to.eq "OK"

      it "resets remoteHost to FQDN", ->
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
          .then (res) ->
            expect(res.text).to.eq "OK"

      it "fetches remote proxy content", ->
        nock("http://localhost:3000")
          .get("/app.css")
          .reply 200, "{}", {
            "Content-Type": "text/html"
          }

        supertest(@app)
          .get("/http://localhost:3000/app.css")
          .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://www.github.com")
          .expect(200)
          .then (res) ->
            expect(res.text).to.eq "{}"

      it "falls back to baseUrl when no FQDN and no remoteHost", ->
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
          .then (res) ->
            expect(res.text).to.eq "{}"

    context "localhost", ->
      it "makes requests to ipv6 when ipv4 fails", (done) ->
        dns.lookup "localhost", {all: true}, (err, addresses) =>
          return done(err) if err

          ## if we dont have multiple addresses aka ipv6 then
          ## just skip this test
          return done() if not _.find(addresses, {family: 6})

          ## create a server that is only bound to ipv6
          ## and ensure that it is found by localhost dns lookup
          server = http.createServer (req, res) ->
            res.writeHead(200)
            res.end()

          ## start the server listening on ipv6 only
          server.listen 6565, "::1", =>

            supertest(@app)
            .get("/#/foo")
            .set("Cookie", "__cypress.remoteHost=http://localhost:6565")
            .expect(200)
            .then ->
              server.close -> done()

    it "handles 204 no content status codes", ->
      nock("http://localhost:4000")
        .get("/user/rooms")
        .reply(204, "")

      supertest(@app)
        .get("/http://localhost:4000/user/rooms")
        .expect(204)
        .expect("")

      # it "handles protocol-less proxies", ->
      #   nock("http://www.cdnjs.com")
      #     .get("backbone.js")
      #     .reply 200, "var foo;", {
      #       "Content-Type" : "text/javascript"
      #     }

      #   supertest(@app)
      #   .get("/www.cdnjs.com/backbone.js")
      #   .expect(200)

  context "POST *", ->
    beforeEach ->
      @baseUrl = "http://localhost:8000"

    it "processes POST + redirect on remote proxy", ->
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

    ## this happens on a real form submit because beforeunload fires
    ## and initial=true gets set
    it "processes POST + redirect on remote initial", ->
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
        .then (res) ->
          console.log res.text
        # .expect(302)
        # .expect "location", /dashboard/

    it "hands back 201 status codes", ->
      nock(@baseUrl)
        .post("/companies/validate", {
          payload: {name: "Brian"}
        })
        .reply(201)

      supertest(@app)
        .post("/companies/validate")
        .send({payload: {name: "Brian"}})
        .set("Cookie", "__cypress.initial=false; __cypress.remoteHost=http://localhost:8000")
        .expect(201)
