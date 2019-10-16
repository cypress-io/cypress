require("../spec_helper")

_             = require("lodash")
http          = require("http")
rp            = require("request-promise")
Promise       = require("bluebird")
evilDns       = require("evil-dns")
httpsServer   = require("#{root}../https-proxy/test/helpers/https_server")
buffers       = require("#{root}lib/util/buffers")
config        = require("#{root}lib/config")
Server        = require("#{root}lib/server")
Fixtures      = require("#{root}test/support/helpers/fixtures")

s3StaticHtmlUrl = "https://s3.amazonaws.com/internal-test-runner-assets.cypress.io/index.html"

expectToEqDetails = (actual, expected) ->
  actual = _.omit(actual, 'totalTime')

  expect(actual).to.deep.eq(expected)

describe "Server", ->
  require("mocha-banner").register()

  beforeEach ->
    sinon.stub(Server.prototype, "reset")

  context "resolving url", ->
    beforeEach ->
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

      nock.enableNetConnect()

      @automationRequest = sinon.stub()
      @automationRequest.withArgs("get:cookies").resolves([])
      @automationRequest.withArgs("set:cookie").resolves({})

      @setup = (initialUrl, obj = {}) =>
        if _.isObject(initialUrl)
          obj = initialUrl
          initialUrl = null

        ## get all the config defaults
        ## and allow us to override them
        ## for each test
        config.set(obj)
        .then (cfg) =>
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

            _.defaults options, {
              url
              proxy: @proxy
              jar
              simple: false
              followRedirect: false
              resolveWithFullResponse: true
            }
            rp(options)

          return Promise.all([
            ## open our https server
            httpsServer.start(8443),

            ## and open our cypress server
            @server = Server()

            @server.open(cfg)
            .spread (port) =>
              if initialUrl
                @server._onDomainSet(initialUrl)

              @srv = @server.getHttpServer()

              # @session = new (Session({app: @srv}))

              @proxy = "http://localhost:" + port

              @fileServer = @server._fileServer.address()
          ])

    afterEach ->
      nock.cleanAll()

      evilDns.clear()

      Promise.join(
        @server.close()
        httpsServer.stop()
      )

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
        @server._onResolveUrl("/index.html", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://localhost:2000/index.html"
            originalUrl: "/index.html"
            filePath: Fixtures.projectPath("no-server/dev/index.html")
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
            expect(res.headers["etag"]).to.exist
            expect(res.headers["set-cookie"]).not.to.match(/initial=;/)
            expect(res.headers["cache-control"]).to.eq("no-cache, no-store, must-revalidate")
            expect(res.body).to.include("index.html content")
            expect(res.body).to.include("document.domain = 'localhost'")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script>\n  </head>")

      it "sends back the content type", ->
        @server._onResolveUrl("/assets/foo.json", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: false
            contentType: "application/json"
            url: "http://localhost:2000/assets/foo.json"
            originalUrl: "/assets/foo.json"
            filePath: Fixtures.projectPath("no-server/dev/assets/foo.json")
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })

      it "buffers the response", ->
        sinon.spy(@server._request, "sendStream")

        @server._onResolveUrl("/index.html", {}, @automationRequest)
        .then (obj = {}) =>
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://localhost:2000/index.html"
            originalUrl: "/index.html"
            filePath: Fixtures.projectPath("no-server/dev/index.html")
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })

          expect(buffers.keys()).to.deep.eq(["http://localhost:2000/index.html"])
        .then =>
          @server._onResolveUrl("/index.html", {}, @automationRequest)
          .then (obj = {}) =>
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "http://localhost:2000/index.html"
              originalUrl: "/index.html"
              filePath: Fixtures.projectPath("no-server/dev/index.html")
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })

            expect(@server._request.sendStream).to.be.calledOnce
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) =>
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("document.domain")
            expect(res.body).to.include("localhost")
            expect(res.body).to.include("Cypress")
            expect(buffers.keys()).to.deep.eq([])

      it "can follow static file redirects", ->
        @server._onResolveUrl("/sub", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://localhost:2000/sub/"
            originalUrl: "/sub"
            filePath: Fixtures.projectPath("no-server/dev/sub/")
            status: 200
            statusText: "OK"
            redirects: ["301: http://localhost:2000/sub/"]
            cookies: []
          })
        .then =>
          @rp("http://localhost:2000/sub/")
          .then (res) =>
            expect(res.statusCode).to.eq(200)

            expect(@server._getRemoteState()).to.deep.eq({
              auth: undefined
              origin: "http://localhost:2000"
              strategy: "file"
              visiting: false
              domainName: "localhost"
              fileServer: @fileServer
              props: null
            })

      it "gracefully handles 404", ->
        @server._onResolveUrl("/does-not-exist", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: false
            isHtml: true
            contentType: "text/html"
            url: "http://localhost:2000/does-not-exist"
            originalUrl: "/does-not-exist"
            filePath: Fixtures.projectPath("no-server/dev/does-not-exist")
            status: 404
            statusText: "Not Found"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://localhost:2000/does-not-exist")
          .then (res) ->
            expect(res.statusCode).to.eq(404)
            expect(res.body).to.include("Cypress errored trying to serve this file from your system:")
            expect(res.body).to.include("does-not-exist")
            expect(res.body).to.include("The file was not found")

      it "handles urls with hashes", ->
        @server._onResolveUrl("/index.html#/foo/bar", {}, @automationRequest)
        .then (obj = {}) =>
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://localhost:2000/index.html"
            originalUrl: "/index.html"
            filePath: Fixtures.projectPath("no-server/dev/index.html")
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })

          expect(buffers.keys()).to.deep.eq(["http://localhost:2000/index.html"])
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) ->
            expect(res.statusCode).to.eq(200)

            expect(buffers.keys()).to.deep.eq([])

    describe "http", ->
      beforeEach ->
        @setup({
          projectRoot: "/foo/bar/"
          config: {
            port: 2000
          }
        })

      context "only having one request in flight at a time", ->
        beforeEach (done) ->
          @httpServer = http.createServer (req, res) ->
            [path, ms] = req.url.split('/').slice(1)

            switch path
              when 'pause-before-body'
                res.writeHead(200, { 'content-type': 'text/html' })
                setTimeout ->
                  res.write('ok')
                  res.end()
                , Number(ms)
              when 'pause-before-headers'
                setTimeout ->
                  res.writeHead(200, { 'content-type': 'text/html' })
                  res.write('ok')
                  res.end()
                , Number(ms)

          @httpServer.listen =>
            @httpPort = @httpServer.address().port
            done()

          @runOneReqTest = (path) =>
            ## put the first request in flight
            p1 = @server._onResolveUrl("http://localhost:#{@httpPort}/#{path}/1000", {}, @automationRequest)

            Promise.delay(100)
            .then =>
              ## the p1 should not have a current promise phase or reqStream until it's canceled
              expect(p1).not.to.have.property('currentPromisePhase')
              expect(p1).not.to.have.property('reqStream')

              ## fire the 2nd request now that the first one has had some time to reach out
              @server._onResolveUrl("http://localhost:#{@httpPort}/#{path}/100", {}, @automationRequest)
            .then (obj) =>
              expectToEqDetails(obj, {
                isOkStatusCode: true
                isHtml: true
                contentType: "text/html"
                url: "http://localhost:#{@httpPort}/#{path}/100"
                originalUrl: "http://localhost:#{@httpPort}/#{path}/100"
                status: 200
                statusText: "OK"
                redirects: []
                cookies: []
              })

              expect(p1.isCancelled()).to.be.true
              expect(p1).to.have.property('currentPromisePhase')
              expect(p1.reqStream.aborted).to.be.true

        it "cancels and aborts the 1st request when it hasn't loaded headers and a 2nd request is made", ->
          @runOneReqTest('pause-before-headers')

        it "cancels and aborts the 1st request when it hasn't loaded body and a 2nd request is made", ->
          @runOneReqTest('pause-before-body')

      it "can serve http requests", ->
        nock("http://getbootstrap.com")
        .matchHeader("user-agent", "foobarbaz")
        .matchHeader("accept", "text/html,*/*")
        .get("/")
        .reply(200, "<html>content</html>", {
          "X-Foo-Bar": "true"
          "Content-Type": "text/html"
          "Cache-Control": "public, max-age=3600"
        })

        headers = {}
        headers["user-agent"] = "foobarbaz"

        @server._onResolveUrl("http://getbootstrap.com/", headers, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://getbootstrap.com/"
            originalUrl: "http://getbootstrap.com/"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://getbootstrap.com/")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
            expect(res.headers["set-cookie"]).not.to.match(/initial=;/)
            expect(res.headers["x-foo-bar"]).to.eq("true")
            expect(res.headers["cache-control"]).to.eq("no-cache, no-store, must-revalidate")
            expect(res.body).to.include("content")
            expect(res.body).to.include("document.domain = 'getbootstrap.com'")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script> </head>content</html>")

      it "sends back the content type", ->
        nock("http://getbootstrap.com")
        .get("/user.json")
        .reply(200, {})

        @server._onResolveUrl("http://getbootstrap.com/user.json", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: false
            contentType: "application/json"
            url: "http://getbootstrap.com/user.json"
            originalUrl: "http://getbootstrap.com/user.json"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })

      it "yields isHtml true for HTML-shaped responses", ->
        nock("http://example.com")
        .get("/")
        .reply(200, "<html>foo</html>")

        @server._onResolveUrl("http://example.com", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: undefined
            url: "http://example.com/"
            originalUrl: "http://example.com/"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })

      it "yields isHtml false for non-HTML-shaped responses", ->
        nock("http://example.com")
        .get("/")
        .reply(200, '{ foo: "bar" }')

        @server._onResolveUrl("http://example.com", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: false
            contentType: undefined
            url: "http://example.com/"
            originalUrl: "http://example.com/"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })

      it "can follow multiple http redirects", ->
        nock("http://espn.com")
        .get("/")
        .reply 301, undefined, {
          "Location": "/foo"
        }
        .get("/foo")
        .reply 302, undefined, {
          "Location": "http://espn.go.com/"
        }

        nock("http://espn.go.com")
        .get("/")
        .reply 200, "<html>content</html>", {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://espn.com/", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://espn.go.com/"
            originalUrl: "http://espn.com/"
            status: 200
            statusText: "OK"
            cookies: []
            redirects: [
              "301: http://espn.com/foo"
              "302: http://espn.go.com/"
            ]
          })
        .then =>
          @rp("http://espn.go.com/")
          .then (res) =>
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("content")
            expect(res.body).to.include("document.domain = 'go.com'")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script> </head>content</html>")

            expect(@server._getRemoteState()).to.deep.eq({
              auth: undefined
              origin: "http://espn.go.com"
              strategy: "http"
              visiting: false
              domainName: "go.com"
              fileServer: null
              props: {
                domain: "go"
                tld: "com"
                port: "80"
              }
            })

      it "buffers the http response", ->
        sinon.spy(@server._request, "sendStream")

        nock("http://espn.com")
        .get("/")
        .reply 301, undefined, {
          "Location": "/foo"
        }
        .get("/foo")
        .reply 302, undefined, {
          "Location": "http://espn.go.com/"
        }

        nock("http://espn.go.com")
        .get("/")
        .reply 200, "<html><head></head><body>espn</body></html>", {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://espn.com/", {}, @automationRequest)
        .then (obj = {}) =>
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://espn.go.com/"
            originalUrl: "http://espn.com/"
            status: 200
            statusText: "OK"
            cookies: []
            redirects: [
              "301: http://espn.com/foo"
              "302: http://espn.go.com/"
            ]
          })

          expect(buffers.keys()).to.deep.eq(["http://espn.go.com/"])
        .then =>
          @server._onResolveUrl("http://espn.com/", {}, @automationRequest)
          .then (obj = {}) =>
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "http://espn.go.com/"
              originalUrl: "http://espn.com/"
              status: 200
              statusText: "OK"
              cookies: []
              redirects: [
                "301: http://espn.com/foo"
                "302: http://espn.go.com/"
              ]
            })

            expect(@server._request.sendStream).to.be.calledOnce
        .then =>
          @rp("http://espn.go.com/")
          .then (res) =>
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("document.domain")
            expect(res.body).to.include("go.com")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script></head><body>espn</body></html>")
            expect(buffers.keys()).to.deep.eq([])

      it "does not buffer 'bad' responses", ->
        sinon.spy(@server._request, "sendStream")

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

        @server._onResolveUrl("http://espn.com/", {}, @automationRequest)
        .then (obj = {}) =>
          expectToEqDetails(obj, {
            isOkStatusCode: false
            isHtml: false
            contentType: undefined
            url: "http://espn.com/"
            originalUrl: "http://espn.com/"
            status: 404
            statusText: "Not Found"
            cookies: []
            redirects: []
          })

          @server._onResolveUrl("http://espn.com/", {}, @automationRequest)
          .then (obj = {}) =>
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "http://espn.go.com/"
              originalUrl: "http://espn.com/"
              status: 200
              statusText: "OK"
              cookies: []
              redirects: [
                "301: http://espn.com/foo"
                "301: http://espn.go.com/"
              ]
            })

            expect(@server._request.sendStream).to.be.calledTwice

      it "gracefully handles 500", ->
        nock("http://mlb.com")
        .get("/")
        .reply 307, undefined, {
          "Location": "http://mlb.mlb.com/"
        }

        nock("http://mlb.mlb.com")
        .get("/")
        .reply 500, undefined, {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://mlb.com/", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: false
            isHtml: true
            contentType: "text/html"
            url: "http://mlb.mlb.com/"
            originalUrl: "http://mlb.com/"
            status: 500
            statusText: "Server Error"
            cookies: []
            redirects: ["307: http://mlb.mlb.com/"]
          })

      it "gracefully handles http errors", ->
        @server._onResolveUrl("http://localhost:64646", {}, @automationRequest)
        .catch (err) ->
          expect(err.message).to.eq("connect ECONNREFUSED 127.0.0.1:64646")
          expect(err.port).to.eq(64646)
          expect(err.code).to.eq("ECONNREFUSED")

      it "handles url hashes", ->
        nock("http://getbootstrap.com")
        .get("/")
        .reply(200, "content page", {
          "Content-Type": "text/html"
        })

        @server._onResolveUrl("http://getbootstrap.com/#/foo", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://getbootstrap.com/"
            originalUrl: "http://getbootstrap.com/"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })

          expect(buffers.keys()).to.deep.eq(["http://getbootstrap.com/"])
        .then =>
          @rp("http://getbootstrap.com/")
          .then (res) ->
            expect(res.statusCode).to.eq(200)

            expect(buffers.keys()).to.deep.eq([])

      it "can serve non 2xx status code requests when option set", ->
        nock("http://google.com")
        .matchHeader("user-agent", "foobarbaz")
        .matchHeader("accept", "text/html,*/*")
        .get("/foo")
        .reply(404, "<html>content</html>", {
          "X-Foo-Bar": "true"
          "Content-Type": "text/html"
          "Cache-Control": "public, max-age=3600"
        })

        headers = {}
        headers["user-agent"] = "foobarbaz"

        @server._onResolveUrl("http://google.com/foo", headers, @automationRequest, { failOnStatusCode: false })
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://google.com/foo"
            originalUrl: "http://google.com/foo"
            status: 404
            statusText: "Not Found"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://google.com/foo")
          .then (res) ->
            expect(res.statusCode).to.eq(404)
            expect(res.headers["set-cookie"]).not.to.match(/initial=;/)
            expect(res.headers["x-foo-bar"]).to.eq("true")
            expect(res.headers["cache-control"]).to.eq("no-cache, no-store, must-revalidate")
            expect(res.body).to.include("content")
            expect(res.body).to.include("document.domain = 'google.com'")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script> </head>content</html>")

      it "passes auth through", ->
        username = "u"
        password = "p"

        base64 = Buffer.from(username + ":" + password).toString("base64")

        auth = {
          username
          password
        }

        nock("http://google.com")
        .get("/index")
        .matchHeader("authorization", "Basic #{base64}")
        .reply(200, "<html>content</html>", {
          "Content-Type": "text/html"
        })
        .get("/index2")
        .matchHeader("authorization", "Basic #{base64}")
        .reply(200, "<html>content</html>", {
          "Content-Type": "text/html"
        })

        headers = {}
        headers["user-agent"] = "foobarbaz"

        @server._onResolveUrl("http://google.com/index", headers, @automationRequest, { auth })
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://google.com/index"
            originalUrl: "http://google.com/index"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://google.com/index2")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: auth
            origin: "http://google.com"
            strategy: "http"
            visiting: false
            domainName: "google.com"
            fileServer: null
            props: {
              domain: "google"
              tld: "com"
              port: "80"
            }
          })

    describe "both", ->
      beforeEach ->
        Fixtures.scaffold("no-server")

        @setup({
          projectRoot: Fixtures.projectPath("no-server")
          config: {
            port: 2000
            fileServerFolder: "dev"
          }
        })

      it "can go from file -> http -> file", ->
        nock("http://www.google.com")
        .get("/")
        .reply 200, "content page", {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("/index.html", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://localhost:2000/index.html"
            originalUrl: "/index.html"
            filePath: Fixtures.projectPath("no-server/dev/index.html")
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
        .then =>
          @server._onResolveUrl("http://www.google.com/", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://www.google.com/"
            originalUrl: "http://www.google.com/"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://www.google.com/")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: undefined
            origin: "http://www.google.com"
            strategy: "http"
            visiting: false
            domainName: "google.com"
            fileServer: null
            props: {
              domain: "google"
              tld: "com"
              port: "80"
            }
          })
        .then =>
          @server._onResolveUrl("/index.html", {}, @automationRequest)
          .then (obj = {}) ->
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "http://localhost:2000/index.html"
              originalUrl: "/index.html"
              filePath: Fixtures.projectPath("no-server/dev/index.html")
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: undefined
            origin: "http://localhost:2000"
            strategy: "file"
            visiting: false
            domainName: "localhost"
            fileServer: @fileServer
            props: null
          })

      it "can go from http -> file -> http", ->
        nock("http://www.google.com")
        .get("/")
        .reply 200, "<html><head></head><body>google</body></html>", {
          "Content-Type": "text/html"
        }
        .get("/")
        .reply 200, "<html><head></head><body>google</body></html>", {
          "Content-Type": "text/html"
        }

        @server._onResolveUrl("http://www.google.com/", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "http://www.google.com/"
            originalUrl: "http://www.google.com/"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("http://www.google.com/")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("document.domain")
            expect(res.body).to.include("google.com")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script></head><body>google</body></html>")
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: undefined
            origin: "http://www.google.com"
            strategy: "http"
            visiting: false
            domainName: "google.com"
            fileServer: null
            props: {
              domain: "google"
              tld: "com"
              port: "80"
            }
          })
        .then =>
          @server._onResolveUrl("/index.html", {}, @automationRequest)
          .then (obj = {}) ->
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "http://localhost:2000/index.html"
              originalUrl: "/index.html"
              filePath: Fixtures.projectPath("no-server/dev/index.html")
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("document.domain")
            expect(res.body).to.include("localhost")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script>\n  </head>")
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: undefined
            origin: "http://localhost:2000"
            strategy: "file"
            visiting: false
            domainName: "localhost"
            fileServer: @fileServer
            props: null
          })
        .then =>
          @server._onResolveUrl("http://www.google.com/", {}, @automationRequest)
          .then (obj = {}) ->
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "http://www.google.com/"
              originalUrl: "http://www.google.com/"
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })
          .then =>
            @rp("http://www.google.com/")
            .then (res) ->
              expect(res.statusCode).to.eq(200)
              expect(res.body).to.include("document.domain")
              expect(res.body).to.include("google.com")
              expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script></head><body>google</body></html>")
          .then =>
            expect(@server._getRemoteState()).to.deep.eq({
              auth: undefined
              origin: "http://www.google.com"
              strategy: "http"
              visiting: false
              domainName: "google.com"
              fileServer: null
              props: {
                domain: "google"
                tld: "com"
                port: "80"
              }
            })

      it "can go from https -> file -> https", ->
        evilDns.add("*.foobar.com", "127.0.0.1")

        @server._onResolveUrl("https://www.foobar.com:8443/", {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: "https://www.foobar.com:8443/"
            originalUrl: "https://www.foobar.com:8443/"
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          @rp("https://www.foobar.com:8443/")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("document.domain")
            expect(res.body).to.include("foobar.com")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script></head><body>https server</body></html>")
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: undefined
            origin: "https://www.foobar.com:8443"
            strategy: "http"
            visiting: false
            domainName: "foobar.com"
            fileServer: null
            props: {
              domain: "foobar"
              tld: "com"
              port: "8443"
            }
          })
        .then =>
          @server._onResolveUrl("/index.html", {}, @automationRequest)
          .then (obj = {}) ->
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "http://localhost:2000/index.html"
              originalUrl: "/index.html"
              filePath: Fixtures.projectPath("no-server/dev/index.html")
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("document.domain")
            expect(res.body).to.include("localhost")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script>\n  </head>")
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: undefined
            origin: "http://localhost:2000"
            strategy: "file"
            visiting: false
            domainName: "localhost"
            fileServer: @fileServer
            props: null
          })
        .then =>
          @server._onResolveUrl("https://www.foobar.com:8443/", {}, @automationRequest)
          .then (obj = {}) ->
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "https://www.foobar.com:8443/"
              originalUrl: "https://www.foobar.com:8443/"
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })
          .then =>
            @rp("https://www.foobar.com:8443/")
            .then (res) ->
              expect(res.statusCode).to.eq(200)
              expect(res.body).to.include("document.domain")
              expect(res.body).to.include("foobar.com")
              expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script></head><body>https server</body></html>")
          .then =>
            expect(@server._getRemoteState()).to.deep.eq({
              auth: undefined
              origin: "https://www.foobar.com:8443"
              strategy: "http"
              visiting: false
              fileServer: null
              domainName: "foobar.com"
              props: {
                domain: "foobar"
                tld: "com"
                port: "8443"
              }
            })

      it "can go from https -> file -> https without a port", ->
        @timeout(5000)

        @server._onResolveUrl(s3StaticHtmlUrl, {}, @automationRequest)
        .then (obj = {}) ->
          expectToEqDetails(obj, {
            isOkStatusCode: true
            isHtml: true
            contentType: "text/html"
            url: s3StaticHtmlUrl
            originalUrl: s3StaticHtmlUrl
            status: 200
            statusText: "OK"
            redirects: []
            cookies: []
          })
        .then =>
          # @server.onRequest (req, res) ->
          #   console.log "ON REQUEST!!!!!!!!!!!!!!!!!!!!!!"

          #   nock("https://s3.amazonaws.com")
          #   .get("/internal-test-runner-assets.cypress.io/index.html")
          #   .reply 200, "<html><head></head><body>jsonplaceholder</body></html>", {
          #     "Content-Type": "text/html"
          #   }

          @rp(s3StaticHtmlUrl)
          .then (res) ->
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("document.domain")
            expect(res.body).to.include("amazonaws.com")
            expect(res.body).to.include("Cypress")
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: undefined
            origin: "https://s3.amazonaws.com"
            strategy: "http"
            visiting: false
            domainName: "amazonaws.com"
            fileServer: null
            props: {
              domain: "amazonaws"
              tld: "com"
              port: "443"
            }
          })
        .then =>
          @server._onResolveUrl("/index.html", {}, @automationRequest)
          .then (obj = {}) ->
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: "http://localhost:2000/index.html"
              originalUrl: "/index.html"
              filePath: Fixtures.projectPath("no-server/dev/index.html")
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })
        .then =>
          @rp("http://localhost:2000/index.html")
          .then (res) ->
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include("document.domain")
            expect(res.body).to.include("localhost")
            expect(res.body).to.include("Cypress.action('app:window:before:load', window); </script>\n  </head>")
        .then =>
          expect(@server._getRemoteState()).to.deep.eq({
            auth: undefined
            origin: "http://localhost:2000"
            strategy: "file"
            visiting: false
            domainName: "localhost"
            fileServer: @fileServer
            props: null
          })
        .then =>
          @server._onResolveUrl(s3StaticHtmlUrl, {}, @automationRequest)
          .then (obj = {}) ->
            expectToEqDetails(obj, {
              isOkStatusCode: true
              isHtml: true
              contentType: "text/html"
              url: s3StaticHtmlUrl
              originalUrl: s3StaticHtmlUrl
              status: 200
              statusText: "OK"
              redirects: []
              cookies: []
            })
          .then =>
            # @server.onNextRequest (req, res) ->
            #   nock("https://s3.amazonaws.com")
            #   .get("/internal-test-runner-assets.cypress.io/index.html")
            #   .reply 200, "<html><head></head><body>jsonplaceholder</body></html>", {
            #     "Content-Type": "text/html"
            #   }

            @rp(s3StaticHtmlUrl)
            .then (res) ->
              expect(res.statusCode).to.eq(200)
              expect(res.body).to.include("document.domain")
              expect(res.body).to.include("amazonaws.com")
              expect(res.body).to.include("Cypress")
          .then =>
            expect(@server._getRemoteState()).to.deep.eq({
              auth: undefined
              origin: "https://s3.amazonaws.com"
              strategy: "http"
              visiting: false
              fileServer: null
              domainName: "amazonaws.com"
              props: {
                domain: "amazonaws"
                tld: "com"
                port: "443"
              }
            })
