# describe "$Cypress.Cy XHR2 Commands", ->
#   enterCommandTestingMode()

#   it "logs all xhr requests", ->
#     @cy
#       .visit("fixtures/html/xhr.html")
#       .window().then (win) ->
#         win.$.ajax({
#           url: "/fixtures/html/dom.html"
#           success: -> "success"
#           error: -> "error"
#         }).done (resp) ->
#           debugger

#   context "#server2", ->
#     describe "Cypress.on(restore)", ->
#       it "calls server#restore"

#     describe ".log", ->
#       it "logs regular requests"

#       it "is a page event"

#       it "snapshots first as 'request'"

#       it "snapshots second as 'response'"

#       it "can turn off logging"

#       context "#onConsole", ->

#   context "#route2", ->
describe "$Cypress.Cy XHR Commands", ->
  enterCommandTestingMode()

  beforeEach ->
    @setup = =>
      @cy.private("xhrUrl", "__cypress/xhrs/")
      @Cypress.trigger "test:before:hooks", {id: 123}

      ## pass up our iframe so the server binds to the XHR
      ## this ends up being faster than doing a cy.visit in every test
      @Cypress.trigger "before:window:load", @$iframe.prop("contentWindow")

      @server = @cy.prop("server")

  afterEach ->
    ## after each test we need to restore the iframe's XHR
    ## object else we would continue to patch it over and over
    @server.restore()

  context "#startXhrServer", ->
    beforeEach ->
      @create = @sandbox.spy $Cypress.Server2, "create"

    it "sends testId", ->
      @setup()
      expect(@create).to.be.calledWithMatch {testId: 123}

    it "sends xhrUrl", ->
      @setup()
      expect(@create).to.be.calledWithMatch {xhrUrl: "__cypress/xhrs/"}

    describe.skip "filtering requests", ->
      beforeEach ->
        @cy.server2()

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
        @cy.server2({ignore: false}).window().then (w) ->
          Promise.resolve(w.$.get("/fixtures/ajax/app.html")).catch -> done()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

        @setup()

      context "requests", ->
        it "immediately logs xhr obj", ->
          @cy
            .server2()
            .route2(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("foo")
              null
            .then ->
              expect(@log.pick("name", "displayName", "event", "alias", "aliasType", "state")).to.deep.eq {
                name: "xhr"
                displayName: "xhr stub"
                event: true
                alias: "getFoo"
                aliasType: "route"
                state: "pending"
              }

              snapshots = @log.get("snapshots")
              expect(snapshots.length).to.eq(1)
              expect(snapshots[0].name).to.eq("request")
              expect(snapshots[0].state).to.be.an("object")

        it "does not end xhr requests when the associated command ends", ->
          logs = null

          @cy
            .server2()
            .route2({
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
          xhrs = null

          @cy
            .server2()
            .route2({
              url: /foo/,
              response: {}
              delay: 50
            }).as("getFoo")
            .window().then (win) ->
              xhr1 = win.$.getJSON("foo1")
              xhr2 = win.$.getJSON("foo2")
              xhr1.abort()

              null
            .then ->
              xhrs = @cy.commands.logs({name: "xhr"})

              expect(xhrs[0].get("state")).to.eq("failed")
              expect(xhrs[0].get("error").name).to.eq("AbortError")
              expect(xhrs[0].get("snapshots").length).to.eq(2)
              expect(xhrs[0].get("snapshots")[0].name).to.eq("request")
              expect(xhrs[0].get("snapshots")[0].state).to.be.a("object")
              expect(xhrs[0].get("snapshots")[1].name).to.eq("aborted")
              expect(xhrs[0].get("snapshots")[1].state).to.be.a("object")

              expect(@cy.prop("requests").length).to.eq(2)

              ## the abort should have set its response
              expect(@cy.prop("responses").length).to.eq(1)
            .wait(["@getFoo", "@getFoo"]).then ->
              ## should not re-snapshot after the response
              expect(xhrs[0].get("snapshots").length).to.eq(2)

        it "#onConsole sets groups Initiator", ->
          @cy
            .window().then (win) ->
              win.$.get("foo")
              null
            .then ->
              onConsole = @log.attributes.onConsole()

              group = onConsole.groups()[0]
              expect(group.name).to.eq("Initiator")
              expect(group.label).to.be.false
              expect(group.items[0]).to.be.a("string")
              expect(group.items[0].split("\n").length).to.gt(1)

      context "responses", ->
        beforeEach ->
          logs = []

          @Cypress.on "log", (log) =>
            logs.push(log)

          @cy
            .server2()
            .route2(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("foo_bar")
              null
            .wait("@getFoo").then ->
              @log = _(logs).find (l) -> l.get("name") is "xhr"

        it "logs obj", ->
          obj = {
            name: "xhr"
            displayName: "xhr stub"
            event: true
            message: ""
            type: "parent"
            aliasType: "route"
            referencesAlias: undefined
            alias: "getFoo"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq(value, "expected key: #{key} to eq value: #{value}")

        it "ends", ->
          expect(@log.get("state")).to.eq("passed")

        it "snapshots again", ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[0].name).to.eq("request")
          expect(@log.get("snapshots")[0].state).to.be.an("object")
          expect(@log.get("snapshots")[1].name).to.eq("response")
          expect(@log.get("snapshots")[1].state).to.be.an("object")

      context "request JSON parsing", ->
        it "adds requestJSON if requesting JSON", (done) ->
          @cy
            .server2()
            .route2({
              method: "POST"
              url: /foo/
              response: {}
              onRequest: (xhr) ->
                expect(xhr).to.have.property("requestJSON")
                expect(xhr.requestJSON).to.deep.eq {foo: "bar"}
                expect(xhr.requestBody).to.eq JSON.stringify({foo: "bar"})
                done()
            })
            .window().then (win) ->
              win.$.ajax
                type: "POST"
                url: "/foo"
                data: JSON.stringify({foo: "bar"})
                dataType: "json"
              null

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
            .server2()
            .route2("POST", /foo/, {}).as("getFoo")
            .window().then (win) ->
              post(win, {foo: "bar1"})
            .wait("@getFoo").its("requestJSON").should("deep.eq", {foo: "bar1"})
            .window().then (win) ->
              post(win, {foo: "bar2"})
            .wait("@getFoo").its("requestJSON").should("deep.eq", {foo: "bar2"})

  context "#server2", ->
    beforeEach ->
      @Cypress.trigger "test:before:hooks"

    it "sets serverIsStubbed", ->
      @cy.server2().then ->
        expect(@cy.prop("serverIsStubbed")).to.be.true

    it "can disable serverIsStubbed", ->
      @cy.server2({enable: false}).then ->
        expect(@cy.prop("serverIsStubbed")).to.be.false

    it "sends enable to server", ->
      set = @sandbox.spy @cy.prop("server"), "set"

      @cy.server2().then ->
        expect(set).to.be.calledWithExactly({enable: true})

  context.skip "#server", ->
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

      @cy.server2()

    it "can accept an object literal as options", (done) ->
      @cy.on "end", =>
        expect(@create.getCall(0).args[1]).to.have.keys _.keys(@options({foo: "foo"}))
        done()

      @cy.server2({foo: "foo"})

    it "can accept an onRequest and onResponse callback", (done) ->
      onRequest = ->
      onResponse = ->

      @cy.on "end", =>
        expect(@create.getCall(0).args[1]).to.have.keys _.keys(@options({onRequest: onRequest, onResponse, onResponse}))
        done()

      @cy.server2(onRequest, onResponse)

    it "can accept onRequest and onRespond through options", (done) ->
      onRequest = ->
      onResponse = ->

      @cy.on "end", =>
        expect(@create.getCall(0).args[1]).to.have.keys _.keys(@options({onRequest: onRequest, onResponse, onResponse}))
        done()

      @cy.server2({onRequest: onRequest, onResponse: onResponse})

    it "starts the fake XHR server", ->
      @cy.server2().then ->
        expect(@cy.prop("sandbox").server).to.be.defined

    it "sets ignore=true by default", ->
      @cy.server2().then ->
        expect(@cy.prop("sandbox").server.xhr.useFilters).to.be.true

    it "can set ignore=false", ->
      @cy.server2({ignore: false}).then ->
        expect(@cy.prop("sandbox").server.xhr.useFilters).to.be.false

    it "sets respond=true by default", ->
      @cy.server2().then ->
        expect(@cy.prop("server")._autoRespond).to.be.true

    it "can set respond=false", ->
      @cy.server2({respond: false}).then ->
        expect(@cy.prop("server")._autoRespond).to.be.false

    it "sets delay to 10ms by default", ->
      @cy.server2().then ->
        expect(@cy.prop("server")._delay).to.eq 10

    it "can set delay to 100ms", ->
      @cy.server2({delay: 100}).then ->
        expect(@cy.prop("server")._delay).to.eq 100

    it "delay prevents a response from immediately responding", ->
      clock = @sandbox.useFakeTimers("setTimeout")

      @cy
        .server2({delay: 5000})
        .route2(/users/, {})
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
          .server2()
          .visit("fixtures/html/sinon.html")

      it "can add routes with no errors", ->
        @cy
          .server2()
          .route2(/foo/, {})
          .visit("fixtures/html/sinon.html")

      it "routes xhr requests", ->
        @cy
          .server2()
          .route2(/foo/, {foo: "bar"})
          .visit("fixtures/html/sinon.html")
          .window().then (w) ->
            w.$.get("/foo")
          .then (resp) ->
            expect(resp).to.deep.eq {foo: "bar"}

      it "works with aliases", ->
        @cy
          .server2()
          .route2(/foo/, {foo: "bar"}).as("getFoo")
          .visit("fixtures/html/sinon.html")
          .window().then (w) ->
            w.$.get("/foo")
          .wait("@getFoo").then (xhr) ->
            expect(xhr.responseText).to.eq JSON.stringify({foo: "bar"})

      it "prevents XHR's from going out from sinon.html", ->
        @cy
          .server2()
          .route2(/bar/, {bar: "baz"}).as("getBar")
          .visit("fixtures/html/sinon.html")
          .wait("@getBar").then (xhr) ->
            expect(xhr.responseText).to.eq JSON.stringify({bar: "baz"})

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      _.each ["asdf", 123, null, undefined], (arg) ->
        it "throws on bad argument: #{arg}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include ".server2() only accepts a single object literal or 2 callback functions!"
            done()

          @cy.server2(arg)

      it "after turning off server it throws attempting to route"

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
            .server2()
            .route2(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("/foo").done ->
                throw new Error("specific ajax error")

  context "#route", ->
    beforeEach ->
      @setup()

      @expectOptionsToBe = (opts) =>
        options = @stub.getCall(0).args[0]
        _.each opts, (value, key) ->
          expect(options[key]).to.deep.eq(opts[key], "failed on property: (#{key})")

      @cy.server2().then ->
        @stub   = @sandbox.spy @server, "stub"

    it "accepts url, response", ->
      @cy.route2("/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
        })

    it "accepts regex url, response", ->
      @cy.route2(/foo/, {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: /foo/
          response: {}
        })

    it.skip "accepts url, response, onRequest", ->
      onRequest = ->

      @cy.route2("/foo", {}, onRequest).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
          onRequest: onRequest
          onResponse: undefined
        })

    it.skip "accepts url, response, onRequest, onResponse", ->
      onRequest = ->
      onResponse = ->

      @cy.route2("/foo", {}, onRequest, onResponse).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
          onRequest: onRequest
          onResponse: onResponse
        })

    it "accepts method, url, response", ->
      @cy.route2("GET", "/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
        })

    it.skip "accepts method, url, response, onRequest", ->
      onRequest = ->

      @cy.route2("GET", "/foo", {}, onRequest).then ->
        @expectOptionsToBe({
          method: "GET"
          url: "/foo"
          status: 200
          response: {}
          onRequest: onRequest
          onResponse: undefined
        })

    it.skip "accepts method, url, response, onRequest, onResponse", ->
      onRequest = ->
      onResponse = ->

      @cy.route2("GET", "/foo", {}, onRequest, onResponse).then ->
        @expectOptionsToBe({
          method: "GET"
          url: "/foo"
          status: 200
          response: {}
          onRequest: onRequest
          onResponse: onResponse
        })

    it "uppercases method", ->
      @cy.route2("get", "/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
        })

    it "accepts string or regex as the url", ->
      @cy.route2("get", /.*/, {}).then ->
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

      @cy.route2(opts).then ->
        @expectOptionsToBe(opts)

    it "can accept wildcard * as URL and converts to /.*/ regex", ->
      opts = {
        url: "*"
        response: {}
      }

      @cy.route2(opts).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: /.*/
          originalUrl: "*"
          response: {}
        })

    it.skip "can explicitly done() in onRequest function", (done) ->
      onRequest = -> done()

      @cy
        .server2()
        .route2("POST", "/users", {}, onRequest)
        .then ->
          @cy.private("window").$.post("/users", "name=brian")

    it.skip "can explicitly done() in onRequest function from options", (done) ->
      @cy
        .server2()
        .route2({
          method: "POST"
          url: "/users"
          response: {}
          onRequest: -> done()
        })
        .then ->
          @cy.private("window").$.post("/users", "name=brian")

    it.skip "adds multiple routes to the responses array", ->
      @cy
        .route2("foo", {})
        .route2("bar", {})
        .then ->
          expect(@cy.prop("sandbox").server.responses).to.have.length(2)

    it.skip "can use regular strings as response", ->
      @cy
        .route2("foo", "foo bar baz").as("getFoo")
        .window().then (win) ->
          win.$.get("foo")
          null
        .wait("@getFoo").then (xhr) ->
          expect(xhr.responseText).to.eq "foo bar baz"

    it.skip "does not error when response is null but respond is false", ->
      @cy.route
        url: /foo/
        respond: false

    describe.skip "request response fixture", ->
      beforeEach ->
        @trigger = @sandbox.stub(@Cypress, "trigger").withArgs("fixture").callsArgWithAsync(2, {foo: "bar"})

      _.each ["fx:", "fixture:"], (type) =>
        it "can pass a #{type} reference to route", ->
          @cy
            .route2(/foo/, "#{type}foo").as("getFoo")
            .window().then (win) ->
              win.$.getJSON("foo")
              null
            .wait("@getFoo").then (xhr) ->
              response = JSON.parse(xhr.responseText)
              expect(response).to.deep.eq {foo: "bar"}

    describe "request response alias", ->
      it "can pass an alias reference to route", ->
        @cy
          .noop({foo: "bar"}).as("foo")
          .route2(/foo/, "@foo").as("getFoo")
          .window().then (win) ->
            win.$.getJSON("foo")
            null
          .wait("@getFoo").then (xhr) ->
            response = JSON.parse(xhr.responseText)
            expect(response).to.deep.eq {foo: "bar"}
            expect(response).to.deep.eq @foo

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws if cy.server2() hasnt been invoked", (done) ->
        @Cypress.restore()
        @Cypress.set(@test)

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() cannot be invoked before starting the cy.server()"
          done()

        @cy.route2()

      it "url must be a string or regexp", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() was called with a invalid url. Url must be either a string or regular expression."
          done()

        @cy.route2({
          url: {}
        })

      it "url must be one of get, put, post, delete, patch, head, options", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() was called with an invalid method: 'POSTS'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS"
          done()

        @cy.route2("posts", "/foo", {})

      it "requires a response", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be called with a response."
          done()

        @cy.route2("post", "/foo")

      it "requires a url when given a response", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be called with a url. It can be a string or regular expression."
          done()

        @cy.route2({})

      it "requires a response with no method", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be called with a response."
          done()

        @cy.route2(/foo/)

      it "requires arguments", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be given a method, url, and response."
          done()

        @cy.route2()

      it.skip "sets err on log when caused by the XHR response", (done) ->
        @Cypress.on "log", (@log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("error")).to.be.ok
          expect(@log.get("error")).to.eq err
          done()

        @cy
          .route2(/foo/, {}).as("getFoo")
          .window().then (win) ->
            win.$.get("foo_bar").done ->
              foo.bar()

      it.skip "explodes if response fixture signature errors", (done) ->
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
          .route2(/foo/, "fixture:bar")

      it.skip "does not retry (cancels existing promise) when xhr errors", (done) ->
        cancel = @sandbox.spy(Promise.prototype, "cancel")

        @cy.on "retry", =>
          if @cy.prop("err")
            done("should have cancelled and not retried after failing")

        @cy.on "fail", (err) =>
          p = @cy.prop("promise")

          _.delay =>
            expect(cancel).to.be.calledOn(p)
            done()
          , 100

        @cy
          .route2({
            url: /foo/,
            response: {}
            delay: 100
          })
          .window().then (win) ->
            win.$.getJSON("/foo").done ->
              throw new Error("foo failed")
            null
          .get("button").should("have.class", "does-not-exist")

      it.skip "explodes if response alias cannot be found", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.route2() could not find a registered alias for: 'bar'. Available aliases are: 'foo'."
          expect(logs.length).to.eq(2)
          expect(@log.get("name")).to.eq "route"
          expect(@log.get("error")).to.eq err
          expect(@log.get("message")).to.eq "/foo/, @bar"
          done()

        @cy
          .wrap({foo: "bar"}).as("foo")
          .route2(/foo/, "@bar")

      _.each [undefined, null], (val) =>
        it.skip "requires response not be #{val}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.route2() cannot accept an undefined or null response. It must be set to something, even an empty string will work."
            done()

          @cy.route2(/foo/, val)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "has name of route", ->
        @cy.route2("/foo", {}).then ->
          expect(@log.get("name")).to.eq "route"

      it "uses the wildcard URL", ->
        @cy.route2("*", {}).then ->
          expect(@log.get("url")).to.eq("*")

      it "#onConsole", ->
        @cy.route2("*", {foo: "bar"}).as("foo").then ->
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

      describe "numResponses", ->
        it "is initially 0", ->
          @cy.route2(/foo/, {}).then =>
            expect(@log.get("numResponses")).to.eq 0

        it "is incremented to 2", ->
          @cy
            .route2(/foo/, {}).then ->
              @route = @log
            .window().then (win) ->
              win.$.get("/foo")
            .then ->
              expect(@route.get("numResponses")).to.eq 1

        it "is incremented for each matching request", ->
          @cy
            .route2(/foo/, {}).then ->
              @route = @log
            .window().then (win) ->
              @cy.Promise.all [
                win.$.get("/foo")
                win.$.get("/foo")
                win.$.get("/foo")
              ]
            .then ->
              expect(@route.get("numResponses")).to.eq 3

  context.skip "Cypress.on(before:window:load)", ->
    beforeEach ->
      ## force us to start from blank window
      @cy.private("$remoteIframe").prop("src", "about:blank")

    it "reapplies server + route automatically before window:load", ->
      ## this tests that the server + routes are automatically reapplied
      ## after the 2nd visit - which is an example of the remote iframe
      ## causing an onBeforeLoad event
      @cy
        .server2()
        .route2(/foo/, {foo: "bar"}).as("getFoo")
        .then ->
          expect(@cy.prop("bindServer")).to.be.a("function")
          expect(@cy.prop("bindRoutes")).to.be.a("array")
        .visit("fixtures/html/sinon.html")
        .then ->
          expect(@cy.prop("bindServer")).to.be.a("function")
          expect(@cy.prop("bindRoutes")).to.be.a("array")
        .visit("fixtures/html/sinon.html")
        .wait("@getFoo").its("url").should("include", "?some=data")

  context.skip "#cancel", ->
    it "calls server#cancel", (done) ->
      cancel = null

      @Cypress.once "abort", ->
        expect(cancel).to.be.called
        done()

      @cy.server2().then ->
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

  context.skip "#respond", ->
    it "calls server#respond", ->
      respond = null

      @cy
        .server2({delay: 100}).then (server) ->
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
          expect(err.message).to.eq "cy.respond() cannot be invoked before starting the cy.server2()"
          done()

        @cy.respond()

      it "errors with no pending requests", (done) ->
        @cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.respond() did not find any pending requests to respond to!"
          done()

        @cy
          .server2()
          .route2(/users/, {})
          .window().then (win) ->
            ## this is waited on to be resolved
            ## because of jquery promise thenable
            win.$.get("/users")
          .respond()

      ## currently this does not fail. we'll wait until someone cares
      # it "errors if response was null or undefined", (done) ->
      #   @cy.on "fail", (err) ->
      #     debugger

      #   @cy
      #     .server2()
      #     .route2({
      #       url: /foo/
      #       respond: false
      #     })
      #     .window().then (win) ->
      #       win.$.get("/foo")
      #       null
      #     .respond()