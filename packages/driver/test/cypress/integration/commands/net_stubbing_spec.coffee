_ = Cypress._
sinon = Cypress.sinon

describe "src/cy/commands/net_stubbing", ->
  context "#route", ->
    context "creating", ->
      beforeEach ->
        ## we don't use cy.spy() because it causes an infinite loop with logging events
        @sandbox = sinon.createSandbox()
        @emit = @sandbox.spy(Cypress, "emit").withArgs("backend:request", "net", "route:added", sinon.match.any)

        @testRoute = (options, handler, expectedEvent, expectedRoute) ->
          cy.route(options, handler).then ->
            handlerId = _.findKey(Cypress.routes, { handler })
            route = Cypress.routes[handlerId]

            expectedEvent.handlerId = handlerId

            expect(@emit).to.be.calledWith "backend:request", "net", "route:added", expectedEvent
            expect(route).to.deep.eq(expectedRoute)

      afterEach ->
        @sandbox.restore()

      it "emits with url, body and stores Route", ->
        handler = "bar"

        url = "http://foo.invalid"

        expectedEvent = {
          routeMatcher: {
            url: {
              type: "glob"
              value: url
            }
          }
          staticResponse: {
            body: "bar"
          }
        }

        expectedRoute = {
          options: {
            url
          }
          handler
          hitCount: 0
        }

        @testRoute(url, handler, expectedEvent, expectedRoute)

      it "emits with url, HTTPController and stores Route", ->
        handler = () => {}

        url = "http://foo.invalid"

        expectedEvent = {
          routeMatcher: {
            url: {
              type: "glob"
              value: url
            }
          }
        }

        expectedRoute = {
          options: {
            url
          }
          handler
          hitCount: 0
        }

        @testRoute(url, handler, expectedEvent, expectedRoute)

      it "emits with regex values stringified and other values copied and stores Route", ->
        handler = () => {}

        options = {
          auth: {
            username: "foo"
            password: /.*/
          }
          headers: {
            "Accept-Language": /hylian/i
            "Content-Encoding": "corrupted"
          }
          hostname: /any.com/
          https: true
          method: "POST"
          path: "/bing?foo"
          pathname: "/bazz"
          port: [1,2,3,4,5,6]
          query: {
            bar: "baz"
            quuz: /(.*)quux/gi
          }
          url: "http://foo.invalid"
          webSocket: false
        }

        expectedEvent = {
          routeMatcher: {
            auth: {
              username: {
                type: "glob"
                value: options.auth.username
              }
              password: {
                type: "regex"
                value: "/.*/"
              }
            }
            headers: {
              "Accept-Language": {
                type: "regex"
                value: "/hylian/i"
              }
              "Content-Encoding": {
                type: "glob"
                value: options.headers["Content-Encoding"]
              }
            }
            hostname: {
              type: "regex"
              value: "/any.com/"
            }
            https: options.https
            method: {
              type: "glob"
              value: options.method
            }
            path: {
              type: "glob"
              value: options.path
            }
            pathname: {
              type: "glob"
              value: options.pathname
            }
            port: options.port
            query: {
              bar: {
                type: "glob"
                value: options.query.bar
              }
              quuz: {
                type: "regex"
                value: "/(.*)quux/gi"
              }
            }
            url: {
              type: "glob"
              value: options.url
            }
            webSocket: options.webSocket
          }
        }

        expectedRoute = {
          options
          handler
          hitCount: 0
        }

        @testRoute(options, handler, expectedEvent, expectedRoute)

    context "stubbing with static responses", ->
      it "works with static body as string", ->
        cy.route({
          url: "*"
        }, "hello world")

        xhr = new XMLHttpRequest()
        xhr.open("GET", "/abc123")
        xhr.send()

      it "can stub a cy.visit with static body", ->
        cy.route("/foo", "<html>hello cruel world</html>")
        .visit("/foo")
        .document()
        .should("contain.text", "hello cruel world")

    context "stubbing with dynamic response", ->
      it "receives the original request in handler", (done) ->
        cy.route "/def456", (req) ->
          req.reply({
            statusCode: 404
          })

          expect(req).to.include({
            url: "http://localhost:3500/def456",
            method: "GET",
            httpVersion: "1.1"
          })

          done()
        .then ->
          xhr = new XMLHttpRequest()
          xhr.open("GET", "/def456")
          xhr.send()

    context "intercepting request", ->
      it "receives the original request body in handler", (done) ->
        cy.route "/aaa", (req) ->
          expect(req.body).to.eq("foo-bar-baz")

          req.reply(200, 'aight')
          done()
        .then ->
          xhr = new XMLHttpRequest()
          xhr.open("POST", "/aaa")
          xhr.send("foo-bar-baz")

      it "can modify original request body and have it passed to next handler", (done) ->
        cy.route "/post-only", (req, next) ->
          expect(req.body).to.eq("foo-bar-baz")

          req.body = 'quuz'

          next()
        .then ->
          cy.route "/post-only", (req, next) ->
            expect(req.body).to.eq('quuz')

            req.body = 'quux'

            next()
        .then ->
          cy.route "/post-only", (req) ->
            expect(req.body).to.eq('quux')

            done()
        .then ->
          xhr = new XMLHttpRequest()
          xhr.open("POST", "/post-only")
          xhr.send("foo-bar-baz")

      it "can modify a cy.visit before it goes out", ->
        cy.route "/dump-headers", (req) ->
          expect(req.headers['foo']).to.eq('bar')

          req.headers['foo'] = 'quux'
        .then ->
          cy.visit({
            url: '/dump-headers',
            headers: {
              'foo': 'bar'
            }
          })

          cy.get('body').should('contain.text', '"foo":"quux"')

    context "intercepting response", ->
      it "receives the original response in handler", (done) ->
        cy.route "/json-content-type", (req) ->
          req.reply (res) ->
            expect(res.body).to.eq('{}')
            done()

          expect(req).to.include({
            url: "http://localhost:3500/json-content-type",
          })
        .then ->
          xhr = new XMLHttpRequest()
          xhr.open("GET", "/json-content-type")
          xhr.send()

    context "intercepting response errors", ->
      it "sends an error object to handler if host DNE", (done) ->
        cy.route "/should-err", (req) ->
          req.reply (res) ->
            expect(res.error).to.include({
              code: 'ECONNREFUSED',
              port: 3333,
            })
            expect(res.url).to.eq("http://localhost:3333/should-err")

            done()
        .then ->
          xhr = new XMLHttpRequest()
          xhr.open("GET", "http://localhost:3333/should-err")
          xhr.send()

      it "can send a successful response even if an error occurs", (done) ->
        cy.route "/should-err", (req) ->
          req.reply (res) ->
            ## TODO: better API for this?
            expect(res.error).to.exist

            res.send({
              statusCode: 200,
              headers: {
                'access-control-allow-origin': '*'
              }
              body: "everything is fine"
            })
        .then ->
          xhr = new XMLHttpRequest()
          xhr.open("GET", "http://localhost:3333/should-err")
          xhr.send()

          xhr.onload = =>
            expect(xhr.responseText).to.eq("everything is fine")
            expect(xhr.status).to.eq(200)

            done()
