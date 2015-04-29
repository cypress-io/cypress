describe "$Cypress.Cy XHR Commands", ->
  enterCommandTestingMode()

  context "#_sandbox", ->
    it "creates a new sandbox", ->
      expect(@cy._sandbox).to.be.null
      @cy._getSandbox()
      expect(@cy._sandbox).to.be.defined

    it "uses existing sandbox", ->
      sandbox = @cy._getSandbox()

      expect(@cy._getSandbox()).to.eq sandbox

    it "restores sandbox during restore", ->
      sandbox = @cy._getSandbox()
      restore = @sandbox.spy sandbox, "restore"

      @Cypress.restore()

      expect(restore).to.be.called

    it "restores sandbox server during restore", ->
      sandbox = @cy._getSandbox()
      sandbox.useFakeServer()
      restore = @sandbox.spy sandbox.server, "restore"

      @Cypress.restore()

      expect(restore).to.be.called

    _.each ["requests", "queue", "responses"], (prop) ->
      it "resets to an empty array references to the sandbox server's prop: #{prop}", ->
        sandbox = @cy._getSandbox()
        sandbox.useFakeServer()
        sandbox.server[prop] = [1,2,3]
        expect(sandbox.server).to.have.property(prop).that.deep.eq [1,2,3]
        @Cypress.restore()
        expect(sandbox.server).to.have.property(prop).that.deep.eq []

    it "nulls the sandbox reference after restore", ->
      @cy._getSandbox()
      @Cypress.restore()
      expect(@cy._sandbox).to.be.null

    describe "#errors", ->
      it "throws when cannot find sinon", ->
        sinon = @cy.sync.window().sinon

        delete @cy.sync.window().sinon

        fn = => @cy._getSandbox()

        expect(fn).to.throw "Could not access the Server, Routes, Stub, Spies, or Mocks. Check to see if your application is loaded and is visible. Please open an issue if you see this message."

        ## restore after the test
        @cy.sync.window().sinon = sinon

  context "#server", ->
    beforeEach ->
      defaults = {
        ignore: true
        respond: true
        delay: 10
        beforeRequest: ->
        afterResponse: ->
        onError: ->
        onFilter: ->
      }

      @options = (obj) ->
        _.extend obj, defaults

      @create = @sandbox.spy @Cypress.Server, "create"

    it "can accept no arguments", (done) ->
      @cy.on "end", =>
        expect(@create.getCall(0).args[1]).to.have.keys _.keys(@options({}))
        done()

      @cy.server()

    it "can accept an object literal as options", (done) ->
      @cy.on "end", =>
        expect(@create.getCall(0).args[1]).to.have.keys _.keys(@options({foo: "foo"}))
        done()

      @cy.server({foo: "foo"})

    it "can accept an onRequest and onResponse callback", (done) ->
      onRequest = ->
      onResponse = ->

      @cy.on "end", =>
        expect(@create.getCall(0).args[1]).to.have.keys _.keys(@options({onRequest: onRequest, onResponse, onResponse}))
        done()

      @cy.server(onRequest, onResponse)

    it "can accept onRequest and onRespond through options", (done) ->
      onRequest = ->
      onResponse = ->

      @cy.on "end", =>
        expect(@create.getCall(0).args[1]).to.have.keys _.keys(@options({onRequest: onRequest, onResponse, onResponse}))
        done()

      @cy.server({onRequest: onRequest, onResponse: onResponse})

    it "starts the fake XHR server", ->
      @cy.server().then ->
        expect(@cy._sandbox.server).to.be.defined

    it "sets ignore=true by default", ->
      @cy.server().then ->
        expect(@cy._sandbox.server.xhr.useFilters).to.be.true

    it "can set ignore=false", ->
      @cy.server({ignore: false}).then ->
        expect(@cy._sandbox.server.xhr.useFilters).to.be.false

    it "sets respond=true by default", ->
      @cy.server().then ->
        expect(@cy.prop("server")._autoRespond).to.be.true

    it "can set respond=false", ->
      @cy.server({respond: false}).then ->
        expect(@cy.prop("server")._autoRespond).to.be.false

    it "sets delay to 10ms by default", ->
      @cy.server().then ->
        expect(@cy.prop("server")._delay).to.eq 10

    it "can set delay to 100ms", ->
      @cy.server({delay: 100}).then ->
        expect(@cy.prop("server")._delay).to.eq 100

    it "delay prevents a response from immediately responding", ->
      clock = @sandbox.useFakeTimers("setTimeout")

      @cy
        .server({delay: 5000})
        .route(/users/, {})
        .window().then (win) ->
          win.$.get("/users")
          clock.tick(4000)
          request = @cy._getSandbox().server.requests[0]
          expect(request.readyState).to.eq(1)

    describe "without sinon present", ->
      beforeEach ->
        ## force us to start from blank window
        @cy.$remoteIframe.prop("src", "about:blank")

      it "can start server with no errors", ->
        @cy
          .server()
          .visit("fixtures/html/sinon.html")

      it "can add routes with no errors", ->
        @cy
          .server()
          .route(/foo/, {})
          .visit("fixtures/html/sinon.html")

      it "routes xhr requests", ->
        @cy
          .server()
          .route(/foo/, {foo: "bar"})
          .visit("fixtures/html/sinon.html")
          .window().then (w) ->
            w.$.get("/foo")
          .then (resp) ->
            expect(resp).to.deep.eq {foo: "bar"}

      it "works with aliases", ->
        @cy
          .server()
          .route(/foo/, {foo: "bar"}).as("getFoo")
          .visit("fixtures/html/sinon.html")
          .window().then (w) ->
            w.$.get("/foo")
          .wait("@getFoo").then (xhr) ->
            expect(xhr.responseText).to.eq JSON.stringify({foo: "bar"})

      it "prevents XHR's from going out from sinon.html", ->
        @cy
          .server()
          .route(/bar/, {bar: "baz"}).as("getBar")
          .visit("fixtures/html/sinon.html")
          .wait("@getBar").then (xhr) ->
            expect(xhr.responseText).to.eq JSON.stringify({bar: "baz"})

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      _.each ["asdf", 123, null, undefined], (arg) ->
        it "throws on bad argument: #{arg}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include ".server() only accepts a single object literal or 2 callback functions!"
            done()

          @cy.server(arg)

      describe ".log", ->
        beforeEach ->
          @Cypress.on "log", (@log) =>

        it "provides specific #onFail", (done) ->
          @cy.on "fail", (err) =>
            obj = {
              name: "request"
              referencesAlias: undefined
              alias: "getFoo"
              aliasType: "route"
              type: "parent"
              error: err
              event: "command"
              message: undefined
            }
            _.each obj, (value, key) =>
              expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

            done()

          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("/foo").done ->
                throw new Error("specific ajax error")

  context "#route", ->
    beforeEach ->
      @expectOptionsToBe = (opts) =>
        options = @stub.getCall(0).args[0]
        _.defaults opts, {delay: 10, respond: true}
        _.each options, (value, key) ->
          expect(options[key]).to.deep.eq(opts[key], "failed on property: (#{key})")

      @cy.server().then ->
        @server = @cy.prop("server")
        @stub   = @sandbox.spy @server, "stub"

    it "accepts url, response", ->
      @cy.route("/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
          onRequest: undefined
          onResponse: undefined
        })

    it "accepts regex url, response", ->
      @cy.route(/foo/, {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: /foo/
          response: {}
          onRequest: undefined
          onResponse: undefined
        })

    it "accepts url, response, onRequest", ->
      onRequest = ->

      @cy.route("/foo", {}, onRequest).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
          onRequest: onRequest
          onResponse: undefined
        })

    it "accepts url, response, onRequest, onResponse", ->
      onRequest = ->
      onResponse = ->

      @cy.route("/foo", {}, onRequest, onResponse).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
          onRequest: onRequest
          onResponse: onResponse
        })

    it "accepts method, url, response", ->
      @cy.route("GET", "/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
          onRequest: undefined
          onResponse: undefined
        })

    it "accepts method, url, response, onRequest", ->
      onRequest = ->

      @cy.route("GET", "/foo", {}, onRequest).then ->
        @expectOptionsToBe({
          method: "GET"
          url: "/foo"
          status: 200
          response: {}
          onRequest: onRequest
          onResponse: undefined
        })

    it "accepts method, url, response, onRequest, onResponse", ->
      onRequest = ->
      onResponse = ->

      @cy.route("GET", "/foo", {}, onRequest, onResponse).then ->
        @expectOptionsToBe({
          method: "GET"
          url: "/foo"
          status: 200
          response: {}
          onRequest: onRequest
          onResponse: onResponse
        })

    it "uppercases method", ->
      @cy.route("get", "/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
        })

    it "accepts string or regex as the url", ->
      @cy.route("get", /.*/, {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: /.*/
          response: {}
        })

    it "accepts an object literal as options", ->
      onRequest = ->
      onResponse = ->

      opts = {
        method: "PUT"
        url: "/foo"
        status: 200
        response: {}
        onRequest: onRequest
        onResponse: onResponse
      }

      @cy.route(opts).then ->
        @expectOptionsToBe(opts)

    it "can accept wildcard * as URL and converts to /.*/ regex", ->
      opts = {
        url: "*"
        response: {}
      }

      @cy.route(opts).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: /.*/
          originalUrl: "*"
          response: {}
        })

    it "can explicitly done() in onRequest function", (done) ->
      onRequest = -> done()

      @cy
        .server()
        .route("POST", "/users", {}, onRequest)
        .then ->
          @cy.sync.window().$.post("/users", "name=brian")

    it "can explicitly done() in onRequest function from options", (done) ->
      @cy
        .server()
        .route({
          method: "POST"
          url: "/users"
          response: {}
          onRequest: -> done()
        })
        .then ->
          @cy.sync.window().$.post("/users", "name=brian")

    it "adds multiple routes to the responses array", ->
      @cy
        .route("foo", {})
        .route("bar", {})
        .then ->
          expect(@cy._sandbox.server.responses).to.have.length(2)

    describe "request JSON parsing", ->
      it "adds requestJSON if requesting JSON", (done) ->
        @cy
          .route({
            method: "POST"
            url: /foo/
            response: {}
            onRequest: (xhr) ->
              expect(xhr).to.have.property("requestJSON")
              expect(xhr.requestJSON).to.deep.eq {foo: "bar"}
              done()
          })
          .then ->
            @cy.sync.window().$.ajax
              type: "POST"
              url: "/foo"
              data: JSON.stringify({foo: "bar"})
              dataType: "json"

    describe "filtering requests", ->
      beforeEach ->
        @cy.server()

      extensions = {
        html: "ajax html"
        js: "{foo: \"bar\"}"
        css: "body {}"
      }

      _.each extensions, (val, ext) ->
        it "filters out non ajax requests by default for extension: .#{ext}", (done) ->
          @cy.sync.window().$.get("/fixtures/ajax/app.#{ext}").done (res) ->
            expect(res).to.eq val
            done()

      it "can disable default filtering", (done) ->
        ## this should throw since it should return 404 when no
        ## route matches it
        @cy.server({ignore: false}).window().then (w) ->
          Promise.resolve(w.$.get("/fixtures/ajax/app.html")).catch -> done()

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws if cy.server() hasnt been invoked", (done) ->
        @Cypress.restore()
        @Cypress.set(@test)

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() cannot be invoked before starting the cy.server()"
          done()

        @cy.route()

      it "url must be a string or regexp", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() was called with a invalid url. Url must be either a string or regular expression."
          done()

        @cy.route({
          url: {}
        })

      it "url must be one of get, put, post, delete, patch, head, options", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() was called with an invalid method: 'POSTS'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS"
          done()

        @cy.route("posts", "/foo", {})

      it "requires a response", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be called with a response."
          done()

        @cy.route("post", "/foo")

      it "requires a url when given a response", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be called with a url. It can be a string or regular expression."
          done()

        @cy.route({})

      it "requires a response with no method", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be called with a response."
          done()

        @cy.route(/foo/)

      it "requires arguments", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be given a method, url, and response."
          done()

        @cy.route()

      it "sets err on log when caused by the XHR response", (done) ->
        @Cypress.on "log", (@log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("error")).to.be.ok
          expect(@log.get("error")).to.eq err
          done()

        @cy
          .route(/foo/, {}).as("getFoo")
          .window().then (win) ->
            win.$.get("foo_bar").done ->
              foo.bar()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "has name of route", ->
        @cy.route("/foo", {}).then ->
          expect(@log.get("name")).to.eq "route"

      it "uses the wildcard URL", ->
        @cy.route("*", {}).then ->
          expect(@log.get("url")).to.eq("*")

      it "#onConsole", ->
        @cy.route("*", {foo: "bar"}).as("foo").then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "route"
            Method: "GET"
            URL: "*"
            Status: 200
            Response: {foo: "bar"}
            Alias: "foo"
            # Responded: 1 time
            # "-------": ""
            # Responses: []

          }

      describe "requests", ->
        it "immediately logs request obj", ->
          @cy
            .route(/foo/, {}).as("getFoo")
            .window().then (win) =>
              win.$.get("foo")
              expect(@log.pick("name", "alias", "aliasType", "state")).to.deep.eq {
                name: "request"
                alias: "getFoo"
                aliasType: "route"
                state: "pending"
              }
              expect(@log.get("snapshot")).to.be.ok

      describe "responses", ->
        beforeEach ->
          @cy
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("foo_bar")
            .wait("@getFoo")

        it "logs obj", ->
          obj = {
            name: "request"
            message: undefined
            type: "parent"
            aliasType: "route"
            referencesAlias: undefined
            alias: "getFoo"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq(value, "expected key: #{key} to eq value: #{value}")

        it "#onConsole", ->

        it "ends", ->
          expect(@log.get("state")).to.eq("success")

        it "snapshots again", ->
          expect(@log.get("snapshot")).to.be.an("object")

  context "#checkForServer", ->
    beforeEach ->
      ## force us to start from blank window
      @cy.$remoteIframe.prop("src", "about:blank")

    it "nukes TMP_SERVER and TMP_ROUTES", ->
      @cy
        .server()
        .route(/foo/, {foo: "bar"})
        .then ->
          expect(@cy.prop("tmpServer")).to.be.a("function")
          expect(@cy.prop("tmpRoutes")).to.be.a("array")
        .visit("fixtures/html/sinon.html")
        .then ->
          expect(@cy.prop("tmpServer")).to.be.null
          expect(@cy.prop("tmpRoutes")).to.be.null

  context "#abort", ->
    it "calls server#abort", (done) ->
      abort = null

      @Cypress.once "abort", ->
        expect(abort).to.be.called
        done()

      @cy.server().then ->
        abort = @sandbox.spy @cy.prop("server"), "abort"
        @Cypress.trigger "abort"

  context "#getPendingRequests", ->
    it "returns [] if not requests", ->
      expect(@cy.getPendingRequests()).to.deep.eq []

    it "returns requests if not responses", ->
      @cy.prop("requests", ["foo", "bar"])
      expect(@cy.getPendingRequests()).to.deep.eq ["foo", "bar"]

    it "returns diff between requests + responses", ->
      @cy.prop("requests", ["foo", "bar", "baz"])
      @cy.prop("responses", ["bar"])
      expect(@cy.getPendingRequests()).to.deep.eq ["foo", "baz"]

  context "#getCompletedRequests", ->
    it "returns [] if not responses", ->
      expect(@cy.getCompletedRequests()).to.deep.eq []

    it "returns responses", ->
      @cy.prop("responses", ["foo"])
      expect(@cy.getCompletedRequests()).to.deep.eq ["foo"]

  context "#respond", ->
    it "calls server#respond", ->
      respond = null

      @cy
        .server({delay: 1000}).then (server) ->
          respond = @sandbox.spy server, "respond"
        .window().then (win) ->
          win.$.get("/users")
          null
        .respond().then ->
          expect(respond).to.be.calledOnce

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "errors without a server", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.respond() cannot be invoked before starting the cy.server()"
          done()

        @cy.respond()

      it "errors with no pending requests", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.respond() did not find any pending requests to respond to!"
          done()

        @cy
          .server()
          .route(/users/, {})
          .window().then (win) ->
            ## this is waited on to be resolved
            ## because of jquery promise thenable
            win.$.get("/users")
          .respond()