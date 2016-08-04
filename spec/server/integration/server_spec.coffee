require("../spec_helper")

_             = require("lodash")
rp            = require("request-promise")
config        = require("#{root}lib/config")
Server        = require("#{root}lib/server")
Request       = require("#{root}lib/request")
Fixtures      = require("#{root}spec/server/helpers/fixtures")

describe "Server", ->
  context "resolving url", ->
    beforeEach ->
      nock.enableNetConnect()

      @automationRequest = @sandbox.stub().resolves([])

      @setup = (initialUrl, obj = {}) =>
        if _.isObject(initialUrl)
          obj = initialUrl
          initialUrl = null

        ## get all the config defaults
        ## and allow us to override them
        ## for each test
        cfg = config.set(obj)

        ## use a jar for each test
        ## but reset it automatically
        ## between test
        jar = rp.jar()

        ## use a custom request promise
        ## to automatically backfill these
        ## options including our proxy
        @rp = (options = {}) =>
          if _.isString(options)
            url = options
            options = {}

          _.defaults options,
            url: url
            proxy: @proxy
            jar: jar
            simple: false
            followRedirect: false
            resolveWithFullResponse: true

          rp(options)

        open = =>
          ## open our https server
          # httpsServer.start(8443),

          ## and open our cypress server
          @server = Server()

          @server.open(cfg)
          .then (port) =>
            if initialUrl
              @server._onDomainSet(initialUrl)

            @srv = @server.getHttpServer()

            # @session = new (Session({app: @srv}))

            @proxy = "http://localhost:" + port

        if @server
          @server.close()
          .then(open)
        else
          open()

    afterEach ->
      nock.cleanAll()

      @server.close()

    describe "file", ->
      beforeEach ->
        Fixtures.scaffold("no-server")

        @setup({
          projectRoot: Fixtures.projectPath("no-server")
          config: {
            port: 2000
            fileServerFolder: "dev"
          }
        })

      it "can serve static assets", ->
        @server._onResolveUrl("/index.html", @automationRequest)
        .then (obj = {}) ->
          expect(obj).to.deep.eq({
            ok: true
            url: "http://localhost:2000/index.html"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) ->
            expect(res.statusCode).to.eq(200)

      it "buffers the response", ->
        @sandbox.spy(Request, "sendStream")

        @server._onResolveUrl("/index.html", @automationRequest)
        .then (obj = {}) =>
          expect(obj).to.deep.eq({
            ok: true
            url: "http://localhost:2000/index.html"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })

          @server._onResolveUrl("/index.html", @automationRequest)
          .then (obj = {}) ->
            expect(obj).to.deep.eq({
              ok: true
              url: "http://localhost:2000/index.html"
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })

            expect(Request.sendStream).to.be.calledOnce

      it "can follow static file redirects", ->
        @server._onResolveUrl("/sub", @automationRequest)
        .then (obj = {}) ->
          expect(obj).to.deep.eq({
            ok: true
            url: "http://localhost:2000/sub/"
            status: 200
            statusText: "OK"
            redirects: ["http://localhost:2000/sub/"]
            cookies: []
          })
        .then =>
          @rp("http://localhost:2000/sub/")
          .then (res) =>
            expect(res.statusCode).to.eq(200)

            expect(@server._getRemoteState()).to.deep.eq({
              origin: "http://localhost:2000"
              strategy: "file"
              visiting: false
              domainName: "localhost"
              props: null
            })

      it "gracefully handles 404", ->
        @server._onResolveUrl("/does-not-exist", @automationRequest)
        .then (obj = {}) ->
          expect(obj).to.deep.eq({
            ok: false
            url: "http://localhost:2000/does-not-exist"
            status: 404
            statusText: "Not Found"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://localhost:2000/does-not-exist")
          .then (res) ->
            expect(res.statusCode).to.eq(404)

    describe "http", ->
      beforeEach ->
        @setup({
          config: {
            port: 2000
          }
        })

      it "can serve http requests", ->
        nock("http://getbootstrap.com")
        .get("/")
        .reply 200, "content page", {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://getbootstrap.com/", @automationRequest)
        .then (obj = {}) ->
          expect(obj).to.deep.eq({
            ok: true
            url: "http://getbootstrap.com/"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://getbootstrap.com/")
          .then (res) ->
            expect(res.statusCode).to.eq(200)

      it "can follow multiple http redirects", ->
        nock("http://espn.com")
        .get("/")
        .reply 301, undefined, {
          "Location": "/foo"
        }
        .get("/foo")
        .reply 301, undefined, {
          "Location": "http://espn.go.com/"
        }

        nock("http://espn.go.com")
        .get("/")
        .reply 200, "content", {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://espn.com/", @automationRequest)
        .then (obj = {}) ->
          expect(obj).to.deep.eq({
            ok: true
            url: "http://espn.go.com/"
            status: 200
            statusText: "OK"
            cookies: []
            redirects: [
              "http://espn.com/foo"
              "http://espn.go.com/"
            ]
          })
        .then =>
          @rp("http://espn.go.com/")
          .then (res) =>
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.eq("content")

            expect(@server._getRemoteState()).to.deep.eq({
              origin: "http://espn.go.com"
              strategy: "http"
              visiting: false
              domainName: "go.com"
              props: {
                domain: "go"
                tld: "com"
                port: "80"
              }
            })

      it "buffers the http response", ->
        @sandbox.spy(Request, "sendStream")

        nock("http://espn.com")
        .get("/")
        .reply 301, undefined, {
          "Location": "/foo"
        }
        .get("/foo")
        .reply 301, undefined, {
          "Location": "http://espn.go.com/"
        }

        nock("http://espn.go.com")
        .get("/")
        .reply 200, "content", {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://espn.com/", @automationRequest)
        .then (obj = {}) =>
          expect(obj).to.deep.eq({
            ok: true
            url: "http://espn.go.com/"
            status: 200
            statusText: "OK"
            cookies: []
            redirects: [
              "http://espn.com/foo"
              "http://espn.go.com/"
            ]
          })

          @server._onResolveUrl("http://espn.com/", @automationRequest)
          .then (obj = {}) ->
            expect(obj).to.deep.eq({
              ok: true
              url: "http://espn.go.com/"
              status: 200
              statusText: "OK"
              cookies: []
              redirects: [
                "http://espn.com/foo"
                "http://espn.go.com/"
              ]
            })

            expect(Request.sendStream).to.be.calledOnce

      it "does not buffer 'bad' responses", ->
        @sandbox.spy(Request, "sendStream")

        nock("http://espn.com")
        .get("/")
        .reply(404, undefined)
        .get("/")
        .reply 301, undefined, {
          "Location": "/foo"
        }
        .get("/foo")
        .reply 301, undefined, {
          "Location": "http://espn.go.com/"
        }

        nock("http://espn.go.com")
        .get("/")
        .reply 200, "content", {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://espn.com/", @automationRequest)
        .then (obj = {}) =>
          expect(obj).to.deep.eq({
            ok: false
            url: "http://espn.com/"
            status: 404
            statusText: "Not Found"
            cookies: []
            redirects: []
          })

          @server._onResolveUrl("http://espn.com/", @automationRequest)
          .then (obj = {}) ->
            expect(obj).to.deep.eq({
              ok: true
              url: "http://espn.go.com/"
              status: 200
              statusText: "OK"
              cookies: []
              redirects: [
                "http://espn.com/foo"
                "http://espn.go.com/"
              ]
            })

            expect(Request.sendStream).to.be.calledTwice

      it "gracefully handles 500", ->
        nock("http://mlb.com")
        .get("/")
        .reply 301, undefined, {
          "Location": "http://mlb.mlb.com/"
        }

        nock("http://mlb.mlb.com")
        .get("/")
        .reply 500, undefined, {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://mlb.com/", @automationRequest)
        .then (obj = {}) ->
          expect(obj).to.deep.eq({
            ok: false
            url: "http://mlb.mlb.com/"
            status: 500
            statusText: "Server Error"
            cookies: []
            redirects: ["http://mlb.mlb.com/"]
          })

      it "gracefully handles http errors", ->
        @server._onResolveUrl("http://localhost:64646", @automationRequest)
        .then (obj = {}) ->
          expect(obj).to.deep.eq({
            __error: "connect ECONNREFUSED 127.0.0.1:64646"
          })
