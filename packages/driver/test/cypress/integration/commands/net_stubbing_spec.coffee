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
          responseBody: "bar"
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
          url: "http://foo.invalid"
          headers: {
            "Accept-Language": /hylian/i
            "Content-Encoding": "corrupted"
          }
          auth: {
            username: "foo"
            password: /.*/
          }
          https: true
          port: [1,2,3,4,5,6]
        }

        expectedEvent = {
          routeMatcher: {
            url: {
              type: "glob"
              value: options.url
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
            https: options.https
            port: options.port
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
          }
        }

        expectedRoute = {
          options
          handler
          hitCount: 0
        }

        @testRoute(options, handler, expectedEvent, expectedRoute)
