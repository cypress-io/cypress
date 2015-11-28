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

#   context "#server", ->
#     describe "Cypress.on(restore)", ->
#       it "calls server#restore"

#     describe ".log", ->
#       it "logs regular requests"

#       it "is a page event"

#       it "snapshots first as 'request'"

#       it "snapshots second as 'response'"

#       it "can turn off logging"

#       context "#onConsole", ->

#   context "#route", ->
describe "$Cypress.Cy XHR Commands", ->
  enterCommandTestingMode()

  beforeEach ->
    @setup = =>
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
      @create = @sandbox.spy $Cypress.Server, "create"

    it "sends testId", ->
      @setup()
      expect(@create).to.be.calledWithMatch {testId: 123}

    it "sends xhrUrl", ->
      @setup()
      expect(@create).to.be.calledWithMatch {xhrUrl: "__cypress/xhrs/"}

    describe.skip "filtering requests", ->
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

    describe "url rewriting", ->
      beforeEach ->
        @setup()

      it "has a FQDN absolute-relative url", ->
        @cy
          .server()
          .route({
            url: /foo/
            stub: false
          }).as("getFoo")
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("/foo")
            null
          .wait("@getFoo").then (xhr) ->
            expect(xhr.url).to.eq("http://localhost:3500/foo")
            expect(@open).to.be.calledWith("GET", "/foo")

      it "has a relative URL", ->
        @cy
          .server()
          .route({
            url: /foo/
            stub: false
          }).as("getFoo")
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("foo")
            null
          .wait("@getFoo").then (xhr) ->
            expect(xhr.url).to.eq("http://localhost:3500/fixtures/html/foo")
            expect(@open).to.be.calledWith("GET", "/fixtures/html/foo")

      it "transparently rewrites FQDN urls which match remote host", ->
        @cy
          .server()
          .route({
            url: /foo/
            stub: false
          }).as("getFoo")
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            ## trick cypress into thinking the remoteOrigin is location:9999
            @sandbox.stub(@cy, "_getLocation").withArgs("origin").returns("http://localhost:9999")
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("http://localhost:9999/foo")
            null
          .wait("@getFoo").then (xhr) ->
            expect(xhr.url).to.eq("http://localhost:9999/foo")
            expect(@open).to.be.calledWith("GET", "/foo")

      it "rewrites FQDN url's for stubs", ->
        @cy
          .server()
          .route({
            url: /foo/
            response: {}
          }).as("getFoo")
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("http://localhost:9999/foo")
            null
          .wait("@getFoo").then (xhr) ->
            expect(xhr.url).to.eq("http://localhost:9999/foo")
            expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/http://localhost:9999/foo")

      it "rewrites absolute url's for stubs", ->
        @cy
          .server()
          .route({
            url: /foo/
            response: {}
          }).as("getFoo")
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("/foo")
            null
          .wait("@getFoo").then (xhr) ->
            expect(xhr.url).to.eq("http://localhost:3500/foo")
            expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/foo")

      it "rewrites 404's url's for stubs", ->
        @cy
          .server()
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            new Promise (resolve) ->
              win.$.ajax({
                method: "POST"
                url: "/foo"
                data: JSON.stringify({foo: "bar"})
              }).fail ->
                resolve()
          .then ->
            xhr = @cy.prop("responses")[0].xhr
            expect(xhr.url).to.eq("http://localhost:3500/foo")
            expect(@open).to.be.calledWith("POST", "/__cypress/xhrs/foo")

      it "rewrites urls with nested segments", ->
        @cy
          .server()
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .route({
            url: /phones/
            response: {}
          }).as("getPhones")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("phones/phones.json")
            null
          .wait("@getPhones")
          .then ->
            xhr = @cy.prop("responses")[0].xhr
            expect(xhr.url).to.eq("http://localhost:3500/fixtures/html/phones/phones.json")
            expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/fixtures/html/phones/phones.json")

      it "does not touch real CORS requests", ->
        @cy
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            new Promise (resolve) ->
              win.$.get("http://www.google.com/phones/phones.json").fail ->
                resolve()
          .then ->
            xhr = @cy.prop("requests")[0].xhr
            expect(xhr.url).to.eq("http://www.google.com/phones/phones.json")
            expect(@open).to.be.calledWith("GET", "http://www.google.com/phones/phones.json")

      it "can stub real CORS requests too", ->
        @cy
          .server()
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .route({
            url: /phones/
            response: {}
          }).as("getPhones")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("http://www.google.com/phones/phones.json")
            null
          .wait("@getPhones")
          .then ->
            xhr = @cy.prop("responses")[0].xhr
            expect(xhr.url).to.eq("http://www.google.com/phones/phones.json")
            expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/http://www.google.com/phones/phones.json")

      it "sets display correctly when there is no remoteOrigin", ->
        ## this is an example of having cypress act as your webserver
        ## when the remoteHost is <root>
        @cy
          .server()
          .route({
            url: /foo/
            response: {}
          }).as("getFoo")
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            ## trick cypress into thinking the remoteOrigin is location:9999
            @sandbox.stub(@cy, "_getLocation").withArgs("origin").returns("")
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("/foo")
            null
          .wait("@getFoo").then (xhr) ->
            expect(xhr.url).to.eq("http://localhost:3500/foo")
            expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/foo")

      it "decodes proxy urls", ->
        @cy
          .server()
          .visit("/fixtures/html/xhr.html")
          .route({
            url: /users/
            response: {}
          }).as("getUsers")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("/users?q=(id eq 123)")
            null
          .wait("@getUsers")
          .then ->
            xhr = @cy.prop("responses")[0].xhr
            expect(xhr.url).to.eq("http://localhost:3500/users?q=(id eq 123)")
            url = encodeURI("users?q=(id eq 123)")
            expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/#{url}")

      it "decodes proxy urls #2", ->
        @cy
          .server()
          .visit("/fixtures/html/xhr.html")
          .route({
            url: /accounts/
            response: {}
          }).as("getAccounts")
          .window().then (win) ->
            @cy.prop("server").restore()
            @open = @sandbox.spy win.XMLHttpRequest.prototype, "open"
            @cy.prop("server").bindTo(win)
            win.$.get("/accounts?page=1&%24filter=(rowStatus+eq+1)&%24orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true")
            null
          .wait("@getAccounts")
          .then ->
            xhr = @cy.prop("responses")[0].xhr
            expect(xhr.url).to.eq("http://localhost:3500/accounts?page=1&$filter=(rowStatus+eq+1)&$orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true")
            url = "accounts?page=1&%24filter=(rowStatus+eq+1)&%24orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true"
            expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/#{url}")

    describe "#onResponse", ->
      beforeEach ->
        @setup()

      it "calls onResponse callback with cy context + proxy xhr", (done) ->
        cy = @cy

        @cy
          .server()
          .route({
            url: /foo/
            response: {foo: "bar"}
            onResponse: (xhr) ->
              expect(@).to.eq(cy)
              expect(xhr.responseBody).to.deep.eq {foo: "bar"}
              done()
          })
          .window().then (win) ->
            win.$.get("/foo")
            null

    describe "request JSON parsing", ->
      beforeEach ->
        @setup()

      it "adds parses requestBody into JSON", (done) ->
        cy = @cy

        @cy
          .server()
          .route({
            method: "POST"
            url: /foo/
            response: {}
            onRequest: (xhr) ->
              expect(@).to.eq(cy)
              expect(xhr.requestBody).to.deep.eq {foo: "bar"}
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
      it "provides the correct requestBody on multiple requests", ->
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
          .wait("@getFoo").its("requestBody").should("deep.eq", {foo: "bar1"})
          .window().then (win) ->
            post(win, {foo: "bar2"})
          .wait("@getFoo").its("requestBody").should("deep.eq", {foo: "bar2"})

    describe "issues #84", ->
      beforeEach ->
        @setup()

      it "does not incorrectly match options", ->
        @cy
          .server()
          .route({
            method: "GET"
            url: /answers/
            status: 503
            response: {}
          })
        .route(/forms/, []).as("getForm")
        .window().then (win) ->
          win.$.getJSON("/forms")
          null
        .wait("@getForm").its("status").should("eq", 200)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

        @setup()

      context "requests", ->
        it "immediately logs xhr obj", ->
          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
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
            .server()
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
          xhrs = null

          @cy
            .server()
            .route({
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

        it "can access requestHeaders", ->
          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.ajax({
                method: "GET"
                url: "/foo"
                headers: {
                  "x-token": "123"
                }
              })
              null
            .wait("@getFoo").its("requestHeaders").should("have.property", "x-token", "123")

      context "responses", ->
        beforeEach ->
          logs = []

          @Cypress.on "log", (log) =>
            logs.push(log)

          @cy
            .server()
            .route(/foo/, {}).as("getFoo")
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

    describe "errors", ->
      beforeEach ->
        @setup()
        @allowErrors()

      it "sets err on log when caused by XHR network failure", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          ## visit + window + xhr log === 3
          expect(logs.length).to.eq(3)
          expect(@log.get("error")).to.be.ok
          expect(@log.get("error")).to.eq err
          done()

        @cy
          .visit("http://localhost:3500/fixtures/html/xhr.html")
          .window().then (win) ->
            new Promise (resolve) ->
              win.$.get("http://www.google.com/foo.json").fail ->
                foo.bar()

  context "#server", ->
    beforeEach ->
      @setup()

    it "sets serverIsStubbed", ->
      @cy.server().then ->
        expect(@cy.prop("serverIsStubbed")).to.be.true

    it "can disable serverIsStubbed", ->
      @cy.server({enable: false}).then ->
        expect(@cy.prop("serverIsStubbed")).to.be.false

    it "sends enable to server", ->
      set = @sandbox.spy @cy.prop("server"), "set"

      @cy.server().then ->
        expect(set).to.be.calledWithExactly({enable: true})

    it "can disable the server after enabling it", ->
      set = @sandbox.spy @cy.prop("server"), "set"

      @cy
        .server()
        .route(/app/, {}).as("getJSON")
        .window().then (win) ->
          win.$.get("/fixtures/ajax/app.json")
          null
        .wait("@getJSON").its("responseBody").should("deep.eq", {})
        .server({enable: false})
        .then ->
          expect(set).to.be.calledWithExactly({enable: false})
        .window().then (win) ->
          win.$.get("/fixtures/ajax/app.json")
          null
        .wait("@getJSON").its("responseBody").should("not.deep.eq", {})

    it "sets delay at 0 by default", ->
      @cy
        .server()
        .route("*", {})
        .then ->
          expect(@cy.prop("server").stubs[0].delay).to.eq(0)

    it "passes down options.delay to routes", ->
      @cy
        .server({delay: 100})
        .route("*", {})
        .then ->
          expect(@cy.prop("server").stubs[0].delay).to.eq(100)

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      context "argument signature", ->
        _.each ["asdf", 123, null, undefined], (arg) ->
          it "throws on bad argument: #{arg}", (done) ->
            @cy.on "fail", (err) ->
              expect(err.message).to.include "cy.server() accepts only an object literal as its argument!"
              done()

            @cy.server(arg)

      it "after turning off server it throws attempting to route", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.route() cannot be invoked before starting the cy.server()")
          done()

        @cy
          .server()
          .route(/app/, {})
          .server({enable: false})
          .route(/app/, {})

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

  context "#route", ->
    beforeEach ->
      @setup()

      @expectOptionsToBe = (opts) =>
        options = @stub.getCall(0).args[0]
        _.each opts, (value, key) ->
          expect(options[key]).to.deep.eq(opts[key], "failed on property: (#{key})")

      @cy.server().then ->
        @stub   = @sandbox.spy @server, "stub"

    it "accepts url, response", ->
      @cy.route("/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
        })

    it "accepts regex url, response", ->
      @cy.route(/foo/, {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: /foo/
          response: {}
        })

    it "accepts url, response, onRequest", ->
      onRequest = ->

      @cy.route({
        url: "/foo",
        response: {},
        onRequest: onRequest
      }).then ->
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

      @cy.route({
        url: "/foo"
        response: {}
        onRequest: onRequest
        onResponse: onResponse
      }).then ->
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
        })

    it "accepts method, url, response, onRequest", ->
      onRequest = ->

      @cy.route({
        method: "GET"
        url: "/foo"
        response: {}
        onRequest: onRequest
      }).then ->
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

      @cy.route({
        method: "GET"
        url: "/foo"
        response: {}
        onRequest: onRequest
        onResponse: onResponse
      }).then ->
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

    it "does not require response or method when stub.false", ->
      @cy
        .server({stub: false})
        .route(/users/).as("getUsers")
        .then ->
          @expectOptionsToBe({
            status: 200
            method: "GET"
            url: /users/
          })

    it "does not require response when stub.false", ->
      @cy
        .server({stub: false})
        .route("POST", /users/).as("createUsers")
        .then ->
          @expectOptionsToBe({
            status: 200
            method: "POST"
            url: /users/
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

    it.skip "adds multiple routes to the responses array", ->
      @cy
        .route("foo", {})
        .route("bar", {})
        .then ->
          expect(@cy.prop("sandbox").server.responses).to.have.length(2)

    it "can use regular strings as response", ->
      @cy
        .route("/foo", "foo bar baz").as("getFoo")
        .window().then (win) ->
          win.$.get("/foo")
          null
        .wait("@getFoo").then (xhr) ->
          expect(xhr.responseBody).to.eq "foo bar baz"

    it.skip "does not error when response is null but respond is false", ->
      @cy.route
        url: /foo/
        respond: false

    describe "request response alias", ->
      it "can pass an alias reference to route", ->
        @cy
          .noop({foo: "bar"}).as("foo")
          .route(/foo/, "@foo").as("getFoo")
          .window().then (win) ->
            win.$.getJSON("foo")
            null
          .wait("@getFoo").then (xhr) ->
            expect(xhr.responseBody).to.deep.eq {foo: "bar"}
            expect(xhr.responseBody).to.deep.eq @foo

      it "can alias a route without stubbing it", ->
        @cy
          .route({
            url: /ajax\/app/
            stub: false
          }).as("getFoo")
          .window().then (win) ->
            win.$.get("/fixtures/ajax/app.json")
            null
          .wait("@getFoo").then (xhr) ->
            log = @cy.commands.logs({name: "xhr"})[0]

            expect(log.get("displayName")).to.eq("xhr")
            expect(log.get("alias")).to.eq("getFoo")

            expect(xhr.responseBody).to.deep.eq({
              some: "json"
              foo: {
                bar: "baz"
              }
            })

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
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push(log)

        @cy.on "fail", (err) =>
          ## route + window + xhr log === 3
          expect(logs.length).to.eq(3)
          expect(@log.get("error")).to.be.ok
          expect(@log.get("error")).to.eq err
          done()

        @cy
          .route(/foo/, {}).as("getFoo")
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
          .route(/foo/, "fixture:bar")

      it "does not retry (cancels existing promise) when xhr errors", (done) ->
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
          .route({
            url: /foo/,
            response: {}
            delay: 100
          })
          .window().then (win) ->
            win.$.getJSON("/foo").done ->
              throw new Error("foo failed")
            null
          .get("button").should("have.class", "does-not-exist")

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

  context "onConsole logs", ->
    beforeEach ->
      @Cypress.on "log", (@log) =>

      @setup()

    describe "zero configuration / zero routes", ->
      beforeEach ->
        @cy
          .server()
          .window().then (win) ->
            new Promise (resolve) ->
              win.$.ajax({
                method: "POST"
                url: "/foo"
                data: JSON.stringify({foo: "bar"})
              }).fail ->
                resolve()

      it "calculates duration", ->
        @cy.then ->
          xhr = @cy.prop("responses")[0].xhr

          onConsole = @log.attributes.onConsole()
          expect(onConsole.Duration).to.be.a("number")
          expect(onConsole.Duration).to.be.gt(1)
          expect(onConsole.Duration).to.be.lt(1000)

      it "sends back regular 404", ->
        @cy.then ->
          xhr = @cy.prop("responses")[0].xhr

          onConsole = _.pick @log.attributes.onConsole(), "Method", "Status", "URL", "XHR"
          expect(onConsole).to.deep.eq({
            Method: "POST"
            Status: "404 (Not Found)"
            URL: "http://localhost:3500/foo"
            XHR: xhr.xhr
          })

    describe "whitelisting", ->
      it "does not send back 404s on whitelisted routes", ->
        @cy
          .server()
          .window().then (win) ->
            win.$.get("/fixtures/ajax/app.js")
          .then (resp) ->
            expect(resp).to.eq "{foo: \"bar\"}"

    describe "route setup", ->
      beforeEach ->
        @cy
          .server()
          .route("/foo", {}).as("anyRequest")
          .window().then (win) ->
            win.$.get("/bar")
            null

      it "sends back 404 when request doesnt match route", ->
        @cy.then ->
          onConsole = @log.attributes.onConsole()
          expect(onConsole.Note).to.eq("The Method + URL for this request did not match any of your routes. It was automatically sent back '404'. Setting cy.server({force404: false}) will turn off this behavior.")

    describe "{force404: false}", ->
      beforeEach ->
        @cy
          .server({force404: false})
          .window().then (win) ->
            win.$.getJSON("/fixtures/ajax/app.json")

      it "logs request + response headers", ->
        @cy.then ->
          onConsole = @log.attributes.onConsole()
          expect(onConsole.Request.headers).to.be.an("object")
          expect(onConsole.Response.headers).to.be.an("object")

      it "logs Method, Status, URL, and XHR", ->
        @cy.then ->
          xhr = @cy.prop("responses")[0].xhr

          onConsole = _.pick @log.attributes.onConsole(), "Method", "Status", "URL", "XHR"
          expect(onConsole).to.deep.eq({
            Method: "GET"
            URL: "http://localhost:3500/fixtures/ajax/app.json"
            Status: "200 (OK)"
            XHR: xhr.xhr
          })

      it "logs response", ->
        @cy.then ->
          onConsole = @log.attributes.onConsole()
          expect(onConsole.Response.body).to.deep.eq({
            some: "json"
            foo: {
              bar: "baz"
            }
          })

      it "sets groups Initiator", ->
        @cy.then ->
          onConsole = @log.attributes.onConsole()

          group = onConsole.groups()[0]
          expect(group.name).to.eq("Initiator")
          expect(group.label).to.be.false
          expect(group.items[0]).to.be.a("string")
          expect(group.items[0].split("\n").length).to.gt(1)

  context.skip "Cypress.on(before:window:load)", ->
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

  context.skip "#cancel", ->
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

  context.skip "#respond", ->
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
      # it "errors if response was null or undefined", (done) ->
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