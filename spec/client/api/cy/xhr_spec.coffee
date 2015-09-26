describe "$Cypress.Cy XHR Commands", ->
  enterCommandTestingMode()

  context "#sandbox", ->
    it "creates a new sandbox", ->
      expect(@cy.prop("sandbox")).to.be.undefined
      @cy._getSandbox()
      expect(@cy.prop("sandbox")).to.be.defined

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

      ## we are on longer reseting these properties on the
      ## sandbox but i cant remember why we stopped. i imagine
      ## after looking at the tons of GC reports i reasoned
      ## we didnt havent to do this anymore
    # _.each ["requests", "queue", "responses"], (prop) ->
    #   it.only "resets to an empty array references to the sandbox server's prop: #{prop}", ->
    #     sandbox = @cy._getSandbox()
    #     sandbox.useFakeServer()
    #     sandbox.server[prop] = [1,2,3]
    #     expect(sandbox.server).to.have.property(prop).that.deep.eq [1,2,3]
    #     @Cypress.restore().then ->
    #       expect(sandbox.server).to.have.property(prop).that.deep.eq []

    it "deletes the sandbox reference after restore", ->
      @cy._getSandbox()
      @Cypress.restore()
      expect(@cy.prop("sandbox")).to.be.undefined

    describe "#errors", ->
      it "throws when cannot find sinon", ->
        sinon = @cy.private("window").sinon

        delete @cy.private("window").sinon

        fn = => @cy._getSandbox()

        expect(fn).to.throw "Could not access the Server, Routes, Stub, Spies, or Mocks. Check to see if your application is loaded and is visible. Please open an issue if you see this message."

        ## restore after the test
        @cy.private("window").sinon = sinon

  context "#server", ->
    beforeEach ->
      defaults = {
        ignore: true
        respond: true
        delay: 10
        beforeRequest: ->
        afterResponse: ->
        onAbort: ->
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
        expect(@cy.prop("sandbox").server).to.be.defined

    it "sets ignore=true by default", ->
      @cy.server().then ->
        expect(@cy.prop("sandbox").server.xhr.useFilters).to.be.true

    it "can set ignore=false", ->
      @cy.server({ignore: false}).then ->
        expect(@cy.prop("sandbox").server.xhr.useFilters).to.be.false

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
        @cy.private("$remoteIframe").prop("src", "about:blank")

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
              name: "xhr"
              referencesAlias: undefined
              alias: "getFoo"
              aliasType: "route"
              type: "parent"
              error: err
              instrument: "command"
              message: ""
              event: true
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
        _.each _(options).omit("log"), (value, key) ->
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
          @cy.private("window").$.post("/users", "name=brian")

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
          @cy.private("window").$.post("/users", "name=brian")

    it "adds multiple routes to the responses array", ->
      @cy
        .route("foo", {})
        .route("bar", {})
        .then ->
          expect(@cy.prop("sandbox").server.responses).to.have.length(2)

    it "can use regular strings as response", ->
      @cy
        .route("foo", "foo bar baz").as("getFoo")
        .window().then (win) ->
          win.$.get("foo")
          null
        .wait("@getFoo").then (xhr) ->
          expect(xhr.responseText).to.eq "foo bar baz"

    it "does not error when response is null but respond is false", ->
      @cy.route
        url: /foo/
        respond: false

    describe "request response fixture", ->
      beforeEach ->
        @trigger = @sandbox.stub(@Cypress, "trigger").withArgs("fixture").callsArgWithAsync(2, {foo: "bar"})

      _.each ["fx:", "fixture:"], (type) =>
        it "can pass a #{type} reference to route", ->
          @cy
            .route(/foo/, "#{type}foo").as("getFoo")
            .window().then (win) ->
              win.$.getJSON("foo")
              null
            .wait("@getFoo").then (xhr) ->
              response = JSON.parse(xhr.responseText)
              expect(response).to.deep.eq {foo: "bar"}

    describe "request response alias", ->
      beforeEach ->
        @trigger = @sandbox.stub(@Cypress, "trigger").withArgs("fixture").callsArgWithAsync(2, {foo: "bar"})

      it "can pass an alias reference to route", ->
        @cy
          .fixture("foo").as("foo")
          .route(/foo/, "@foo").as("getFoo")
          .window().then (win) ->
            win.$.getJSON("foo")
            null
          .wait("@getFoo").then (xhr) ->
            response = JSON.parse(xhr.responseText)
            expect(response).to.deep.eq {foo: "bar"}
            expect(response).to.deep.eq @foo

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
            @cy.private("window").$.ajax
              type: "POST"
              url: "/foo"
              data: JSON.stringify({foo: "bar"})
              dataType: "json"

      ## https://github.com/cypress-io/cypress/issues/65
      it "provides the correct requestJSON on multiple requests", ->
        post = (win, obj) ->
          win.$.ajax({
            type: "POST"
            url: "/foo"
            data: JSON.stringify(obj)
            dataType: "json"
          })

          return null

        @cy
          .server()
          .route("POST", /foo/, {}).as("getFoo")
          .window().then (win) ->
            post(win, {foo: "bar1"})
          .wait("@getFoo").its("requestJSON").should("deep.eq", {foo: "bar1"})
          .window().then (win) ->
            post(win, {foo: "bar2"})
          .wait("@getFoo").its("requestJSON").should("deep.eq", {foo: "bar2"})

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
          @cy.private("window").$.get("/fixtures/ajax/app.#{ext}").done (res) ->
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

      it "explodes if response fixture signature errors", (done) ->
        @trigger = @sandbox.stub(@Cypress, "trigger").withArgs("fixture").callsArgWithAsync(2, {__error: "some error"})

        logs = []

        _this = @

        ## we have to restore the trigger when commandErr is called
        ## so that something logs out!
        @cy.commandErr = _.wrap @cy.commandErr, (orig, err) ->
          _this.Cypress.trigger.restore()
          orig.call(@, err)

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.eq "some error"
          expect(logs.length).to.eq(1)
          expect(@log.get("name")).to.eq "route"
          expect(@log.get("error")).to.eq err
          expect(@log.get("message")).to.eq "/foo/, fixture:bar"
          done()

        @cy
          .route(/foo/, "fixture:bar")

      it "explodes if response alias cannot be found", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.route() could not find a registered alias for: 'bar'. Available aliases are: 'foo'."
          expect(logs.length).to.eq(2)
          expect(@log.get("name")).to.eq "route"
          expect(@log.get("error")).to.eq err
          expect(@log.get("message")).to.eq "/foo/, @bar"
          done()

        @cy
          .wrap({foo: "bar"}).as("foo")
          .route(/foo/, "@bar")

      _.each [undefined, null], (val) =>
        it "requires response not be #{val}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.route() cannot accept an undefined or null response. It must be set to something, even an empty string will work."
            done()

          @cy.route(/foo/, val)

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
        it "immediately logs xhr obj", ->
          @cy
            .route(/foo/, {}).as("getFoo")
            .window().then (win) =>
              win.$.get("foo")
              expect(@log.pick("name", "event", "alias", "aliasType", "state")).to.deep.eq {
                name: "xhr"
                event: true
                alias: "getFoo"
                aliasType: "route"
                state: "pending"
              }
              ## snapshots should not be taken when
              ## logs are first inserted (but once multiple
              ## snapshots are working, it should do one at first
              ## and then another when it ends)
              expect(@log.get("snapshot")).not.to.be.ok

        it "does not end xhr requests when the associated command ends", ->
          logs = null

          @cy
            .route({
              url: /foo/,
              response: {}
              delay: 50
            }).as("getFoo")
            .window().then (w) ->
              w.$.getJSON("foo")
              w.$.getJSON("foo")
              w.$.getJSON("foo")
              null
            .then ->
              cmd = @cy.commands.findWhere({name: "window"})
              logs = cmd.get("next").get("logs")

              expect(logs.length).to.eq(3)

              _.each logs, (log) ->
                expect(log.get("name")).to.eq("xhr")
                expect(log.get("end")).not.to.be.true
            .wait(["@getFoo", "@getFoo", "@getFoo"]).then  ->
              _.each logs, (log) ->
                expect(log.get("name")).to.eq("xhr")
                expect(log.get("end")).to.be.true

        it "updates log immediately whenever an xhr is aborted", ->
          snapshot = null

          @cy
            .route({
              url: /foo/,
              response: {}
              delay: 50
            }).as("getFoo")
            .window().then (w) ->
              xhr = w.$.getJSON("foo")
              w.$.getJSON("foo")
              xhr.abort()

              null
            .then ->
              xhrs = @cy.commands.logs({name: "xhr"})

              snapshot = @sandbox.spy(xhrs[0], "snapshot")

              expect(xhrs[0].get("state")).to.eq("failed")
              expect(xhrs[0].get("error").name).to.eq("AbortError")
              expect(xhrs[0].get("snapshot")).to.be.an("object")

              expect(@cy.prop("requests").length).to.eq(2)
              expect(@cy.prop("responses")).to.be.undefined
            .wait(["@getFoo", "@getFoo"]).then ->
              ## should not re-snapshot after the response
              expect(snapshot).not.to.be.called

      describe "responses", ->
        beforeEach ->
          logs = []

          @Cypress.on "log", (log) =>
            logs.push(log)

          @cy
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("foo_bar")
            .wait("@getFoo").then ->
              @log = _(logs).find (l) -> l.get("name") is "xhr"

        it "logs obj", ->
          obj = {
            name: "xhr"
            event: true
            message: ""
            type: "parent"
            aliasType: "route"
            referencesAlias: undefined
            alias: "getFoo"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq(value, "expected key: #{key} to eq value: #{value}")

        it "#onConsole", ->

        it "ends", ->
          expect(@log.get("state")).to.eq("passed")

        it "snapshots again", ->
          expect(@log.get("snapshot")).to.be.an("object")

      describe "numResponses", ->
        it "is initially 0", ->
          @cy.route(/foo/, {}).then =>
            expect(@log.get("numResponses")).to.eq 0

        it "is incremented to 2", ->
          @cy
            .route(/foo/, {}).then ->
              @route = @log
            .window().then (win) ->
              win.$.get("/foo")
            .then ->
              expect(@route.get("numResponses")).to.eq 1

        it "is incremented for each matching request", ->
          @cy
            .route(/foo/, {}).then ->
              @route = @log
            .window().then (win) ->
              @cy.Promise.all [
                win.$.get("/foo")
                win.$.get("/foo")
                win.$.get("/foo")
              ]
            .then ->
              expect(@route.get("numResponses")).to.eq 3

  context "Cypress.on(before:window:load)", ->
    beforeEach ->
      ## force us to start from blank window
      @cy.private("$remoteIframe").prop("src", "about:blank")

    it "reapplies server + route automatically before window:load", ->
      ## this tests that the server + routes are automatically reapplied
      ## after the 2nd visit - which is an example of the remote iframe
      ## causing an onBeforeLoad event
      @cy
        .server()
        .route(/foo/, {foo: "bar"}).as("getFoo")
        .then ->
          expect(@cy.prop("bindServer")).to.be.a("function")
          expect(@cy.prop("bindRoutes")).to.be.a("array")
        .visit("fixtures/html/sinon.html")
        .then ->
          expect(@cy.prop("bindServer")).to.be.a("function")
          expect(@cy.prop("bindRoutes")).to.be.a("array")
        .visit("fixtures/html/sinon.html")
        .wait("@getFoo").its("url").should("include", "?some=data")

  context "#cancel", ->
    it "calls server#cancel", (done) ->
      cancel = null

      @Cypress.once "abort", ->
        expect(cancel).to.be.called
        done()

      @cy.server().then ->
        cancel = @sandbox.spy @cy.prop("server"), "cancel"
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
        .server({delay: 100}).then (server) ->
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

      ## currently this does not fail. we'll wait until someone cares
      # it.only "errors if response was null or undefined", (done) ->
      #   @cy.on "fail", (err) ->
      #     debugger

      #   @cy
      #     .server()
      #     .route({
      #       url: /foo/
      #       respond: false
      #     })
      #     .window().then (win) ->
      #       win.$.get("/foo")
      #       null
      #     .respond()