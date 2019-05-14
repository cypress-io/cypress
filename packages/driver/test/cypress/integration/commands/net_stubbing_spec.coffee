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

    context "stubbing with dynamic response", ->
      it.only "receives the original request in handler", (done) ->
        cy.route "/abc123", (req) ->
          expect(req.url).to.eq("/abc123")
          done()

        xhr = new XMLHttpRequest()
        xhr.open("GET", "/abc123")
        xhr.send()
