getNames = (queue) ->
  _(queue).pluck("name")

getFirstSubjectByName = (name) ->
  _(cy.queue).findWhere({name: name}).subject

describe "Cypress", ->
  before ->
    ## set the jquery engine to be our window so we dont have to juggle
    ## the gazillions of edge cases caused by the remote $ elements being
    ## juggled throughout our expectations
    Cypress.option("jQuery", $)

    ## this immediately restores the chai.Assertion::assert else
    ## all of our expect messages would be completely foobar'd
    ## since the modified assert literally modifies the expectation
    Cypress.Chai.restoreAssert()
    Cypress.start()

    @loadDom = (fixture = "html/dom") =>
      loadFixture(fixture).done (iframe) =>
        @iframe = $(iframe)
        @head = @iframe.contents().find("head").children().prop("outerHTML")
        @body = @iframe.contents().find("body").children().prop("outerHTML")

    @loadDom()

  beforeEach ->
    @setup = =>
      ## do not reset the contents if we're testing angular
      ## else it will completely blow up
      if not @iframe.prop("contentWindow").angular
        @iframe.contents().find("head").html(@head)
        @iframe.contents().find("body").html(@body)

      Cypress.set(@currentTest) if @currentTest
      Cypress.setup(runner, @iframe, ->)

    ## if we've changed the src by navigating
    ## away (aka cy.visit(...)) then we need
    ## to reload the fixture again and then setup
    if /dom/.test(@iframe.attr("src"))
      @setup()
    else
      @loadDom().then @setup

  afterEach ->
    Cypress.off("log")
    Cypress.abort()

  after ->
    Cypress.stop()

  context "#$", ->
    it "queries the remote document", ->
      input = cy.$("#by-name input:first")
      expect(input.length).to.eq 1
      expect(input.prop("tagName")).to.eq "INPUT"

    it "scopes the selector to context if provided", ->
      input = cy.$("input:first", cy.$("#by-name"))
      expect(input.length).to.eq 1
      expect(input.prop("tagName")).to.eq "INPUT"

  context "#_sandbox", ->
    it "creates a new sandbox", ->
      expect(cy._sandbox).to.be.null
      cy._getSandbox()
      expect(cy._sandbox).to.be.defined

    it "uses existing sandbox", ->
      sandbox = cy._getSandbox()

      expect(cy._getSandbox()).to.eq sandbox

    it "restores sandbox during restore", ->
      sandbox = cy._getSandbox()
      restore = @sandbox.spy sandbox, "restore"

      Cypress.restore()

      expect(restore).to.be.called

    it "restores sandbox server during restore", ->
      sandbox = cy._getSandbox()
      sandbox.useFakeServer()
      restore = @sandbox.spy sandbox.server, "restore"

      Cypress.restore()

      expect(restore).to.be.called

    _.each ["requests", "queue", "responses"], (prop) ->
      it "resets to an empty array references to the sandbox server's prop: #{prop}", ->
        sandbox = cy._getSandbox()
        sandbox.useFakeServer()
        sandbox.server[prop] = [1,2,3]
        expect(sandbox.server).to.have.property(prop).that.deep.eq [1,2,3]
        Cypress.restore()
        expect(sandbox.server).to.have.property(prop).that.deep.eq []

    it "nulls the sandbox reference after restore", ->
      cy._getSandbox()
      Cypress.restore()
      expect(cy._sandbox).to.be.null

    describe "#errors", ->
      it "throws when cannot find sinon", ->
        sinon = cy.sync.window().sinon

        delete cy.sync.window().sinon

        fn = -> cy._getSandbox()

        expect(fn).to.throw "sinon.js was not found in the remote iframe's window."

        ## restore after the test
        cy.sync.window().sinon = sinon

  context "#server", ->
    beforeEach ->
      defaults = {
        ignore: true
        autoRespond: true
        autoRespondAfter: 10
        afterResponse: ->
        onError: ->
        onFilter: ->
      }

      @options = (obj) ->
        _.extend obj, defaults

      @server = @sandbox.spy Cypress, "server"

    it "can accept no arguments", (done) ->
      cy.on "end", =>
        expect(@server.getCall(0).args[1]).to.have.keys _.keys(@options({}))
        done()

      cy.server()

    it "can accept an object literal as options", (done) ->
      cy.on "end", =>
        expect(@server.getCall(0).args[1]).to.have.keys _.keys(@options({foo: "foo"}))
        done()

      cy.server({foo: "foo"})

    it "can accept an onRequest and onResponse callback", (done) ->
      onRequest = ->
      onResponse = ->

      cy.on "end", =>
        expect(@server.getCall(0).args[1]).to.have.keys _.keys(@options({onRequest: onRequest, onResponse, onResponse}))
        done()

      cy.server(onRequest, onResponse)

    it "can accept onRequest and onRespond through options", (done) ->
      onRequest = ->
      onResponse = ->

      cy.on "end", =>
        expect(@server.getCall(0).args[1]).to.have.keys _.keys(@options({onRequest: onRequest, onResponse, onResponse}))
        done()

      cy.server({onRequest: onRequest, onResponse: onResponse})

    it "starts the fake XHR server", ->
      cy.server().then ->
        expect(cy._sandbox.server).to.be.defined

    it "sets ignore=true by default", ->
      cy.server().then ->
        expect(cy._sandbox.server.xhr.useFilters).to.be.true

    it "can set ignore=false", ->
      cy.server({ignore: false}).then ->
        expect(cy._sandbox.server.xhr.useFilters).to.be.false

    it "sets autoRespond=true by default", ->
      cy.server().then ->
        expect(cy._sandbox.server.autoRespond).to.be.true

    it "can set autoRespond=false", ->
      cy.server({autoRespond: false}).then ->
        expect(cy._sandbox.server.autoRespond).to.be.false

    it "sets autoRespondAfter to 10ms by default", ->
      cy.server().then ->
        expect(cy._sandbox.server.autoRespondAfter).to.eq 10

    it "can set autoRespondAfter to 100ms", ->
      cy.server({autoRespondAfter: 100}).then ->
        expect(cy._sandbox.server.autoRespondAfter).to.eq 100

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      _.each ["asdf", 123, null, undefined], (arg) ->
        it "throws on bad argument: #{arg}", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include ".server() only accepts a single object literal or 2 callback functions!"
            done()

          cy.server(arg)

      describe ".log", ->
        beforeEach ->
          Cypress.on "log", (@log) =>

        it "provides specific #onFail", (done) ->
          cy.on "fail", (err) =>
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

          cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .window().then (win) ->
              win.$.get("/foo").done ->
                throw new Error("specific ajax error")

  context "#route", ->
    beforeEach ->
      @expectOptionsToBe = (opts) =>
        options = @stub.getCall(0).args[0]
        _.each options, (value, key) ->
          expect(options[key]).to.deep.eq(opts[key], "failed on property: (#{key})")

      cy.server().then ->
        @server = cy.prop("server")
        @stub   = @sandbox.spy @server, "stub"

    it "accepts url, response", ->
      cy.route("/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
          onRequest: undefined
          onResponse: undefined
        })

    it "accepts regex url, response", ->
      cy.route(/foo/, {}).then ->
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

      cy.route("/foo", {}, onRequest).then ->
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

      cy.route("/foo", {}, onRequest, onResponse).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
          onRequest: onRequest
          onResponse: onResponse
        })

    it "accepts method, url, response", ->
      cy.route("GET", "/foo", {}).then ->
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

      cy.route("GET", "/foo", {}, onRequest).then ->
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

      cy.route("GET", "/foo", {}, onRequest, onResponse).then ->
        @expectOptionsToBe({
          method: "GET"
          url: "/foo"
          status: 200
          response: {}
          onRequest: onRequest
          onResponse: onResponse
        })

    it "uppercases method", ->
      cy.route("get", "/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: "/foo"
          response: {}
        })

    it "accepts string or regex as the url", ->
      cy.route("get", /.*/, {}).then ->
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

      cy.route(opts).then ->
        @expectOptionsToBe(opts)

    it "can accept wildcard * as URL and converts to /.*/ regex", ->
      opts = {
        url: "*"
        response: {}
      }

      cy.route(opts).then ->
        @expectOptionsToBe({
          method: "GET"
          status: 200
          url: /.*/
          originalUrl: "*"
          response: {}
        })

    it "can explicitly done() in onRequest function", (done) ->
      onRequest = -> done()

      cy
        .server()
        .route("POST", "/users", {}, onRequest)
        .then ->
          cy.sync.window().$.post("/users", "name=brian")

    it "can explicitly done() in onRequest function from options", (done) ->
      cy
        .server()
        .route({
          method: "POST"
          url: "/users"
          response: {}
          onRequest: -> done()
        })
        .then ->
          cy.sync.window().$.post("/users", "name=brian")

    it "adds multiple routes to the responses array", ->
      cy
        .route("foo", {})
        .route("bar", {})
        .then ->
          expect(cy._sandbox.server.responses).to.have.length(2)

    describe "request JSON parsing", ->
      it "adds requestJSON if requesting JSON", (done) ->
        cy
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
            cy.sync.window().$.ajax
              type: "POST"
              url: "/foo"
              data: JSON.stringify({foo: "bar"})
              dataType: "json"

    describe "filtering requests", ->
      beforeEach ->
        cy.server()

      extensions = {
        html: "ajax html"
        js: "{foo: \"bar\"}"
        css: "body {}"
      }

      _.each extensions, (val, ext) ->
        it "filters out non ajax requests by default for extension: .#{ext}", (done) ->
          cy.sync.window().$.get("/fixtures/ajax/app.#{ext}").done (res) ->
            expect(res).to.eq val
            done()

      it "can disable default filtering", (done) ->
        ## this should throw since it should return 404 when no
        ## route matches it
        cy.server({ignore: false}).window().then (w) ->
          Promise.resolve(w.$.get("/fixtures/ajax/app.html")).catch -> done()

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws if cy.server() hasnt been invoked", (done) ->
        Cypress.restore()
        Cypress.set(@test)

        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() cannot be invoked before starting the cy.server()"
          done()

        cy.route()

      it "requires url", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be called with a url. It can be a string or regular expression."
          done()

        cy.route()

      it "url must be a string or regexp", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() was called with a invalid url. Url must be either a string or regular expression."
          done()

        cy.route({
          url: {}
        })

      it "url must be one of get, put, post, delete, patch, head, options", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() was called with an invalid method: 'POSTS'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS"
          done()

        cy.route("posts", "/foo", {})

      it "requires a response", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.route() must be called with a response."
          done()

        cy.route("post", "/foo")

      it "catches errors caused by the XHR response"

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "has name of route", ->
        cy.route("/foo", {}).then ->
          expect(@log.get("name")).to.eq "route"

      it "uses the wildcard URL", ->
        cy.route("*", {}).then ->
          expect(@log.get("url")).to.eq("*")

      it "#onConsole", ->
        cy.route("*", {foo: "bar"}).as("foo").then ->
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

      describe "responses", ->
        beforeEach ->
          cy
            .route(/foo/, {})
            .window().then (win) ->
              win.$.get("foo_bar")

        it "logs obj", ->
          obj = {
            name: "request"
            message: undefined
            type: "parent"
            aliasType: "route"
            referencesAlias: undefined
            alias: undefined
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq(value, "expected key: #{key} to eq value: #{value}")

        it "#onConsole", ->

        it "ends immediately", ->
          expect(@log.get("end")).to.be.tru
          expect(@log.get("state")).to.eq("success")

        it "snapshots immediately", ->
          expect(@log.get("snapshot")).to.be.an("object")

  context "#agents", ->
    beforeEach ->
      @agents = cy.agents()

    it "is synchronous", ->
      expect(@agents).to.have.property("spy")
      expect(@agents).to.have.property("stub")
      expect(@agents).to.have.property("mock")

    it "uses existing sandbox"

    describe "#spy", ->
      it "proxies to sinon spy", ->
        spy = @agents.spy()
        spy()
        expect(spy.callCount).to.eq(1)

      describe ".log", ->
        beforeEach ->
          Cypress.on "log", (@log) =>

          cy.noop({})

        it "logs obj", ->
          spy = @agents.spy()
          spy("foo", "bar")

          expect(@log.get("name")).to.eq("spy-1")
          expect(@log.get("message")).to.eq("function(arg1, arg2)")
          expect(@log.get("type")).to.eq("parent")
          expect(@log.get("state")).to.eq("success")
          expect(@log.get("snapshot")).to.be.an("object")

        context "#onConsole", ->

  context "#clearLocalStorage", ->
    it "is defined", ->
      expect(cy.clearLocalStorage).to.be.defined

    it "passes keys onto Cypress.LocalStorage.clear", ->
      clear = @sandbox.spy Cypress.LocalStorage, "clear"

      cy.clearLocalStorage("foo").then ->
        expect(clear).to.be.calledWith "foo"

    it "sets the storages", ->
      localStorage = window.localStorage
      remoteStorage = cy.sync.window().localStorage

      setStorages = @sandbox.spy Cypress.LocalStorage, "setStorages"

      cy.clearLocalStorage().then ->
        expect(setStorages).to.be.calledWith localStorage, remoteStorage

    it "unsets the storages", ->
      unsetStorages = @sandbox.spy Cypress.LocalStorage, "unsetStorages"

      cy.clearLocalStorage().then ->
        expect(unsetStorages).to.be.called

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when being passed a non string or regexp", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.clearLocalStorage() must be called with either a string or regular expression!"
          done()

        cy.clearLocalStorage({})

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "ends immediately", ->
        cy.clearLocalStorage().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("success")

      it "snapshots immediately", ->
        cy.clearLocalStorage().then ->
          expect(@log.get("snapshot")).to.be.an("object")

  context "#ng", ->
    context "find by binding", ->
      beforeEach ->
        @loadDom("html/angular").then =>
          @setup()
          @currentTest.timeout(400)

      it "finds color.name binding elements", ->
        spans = cy.$(".colors span.name")

        cy.ng("binding", "color.name").then ($spans) ->
          $spans.each (i, span) ->
            expect(span).to.eq(spans[i])

      describe "errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it "throws when cannot find angular", (done) ->
          delete cy.sync.window().angular

          cy.on "fail", (err) ->
            expect(err.message).to.include "Angular global (window.angular) was not found in your window! You cannot use .ng() methods without angular."
            done()

          cy.ng("binding", "phone")

        it "throws when binding cannot be found", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "Could not find element for binding: 'not-found'!"
            done()

          cy.ng("binding", "not-found")

        it "cancels additional finds when aborted", (done) ->
          retry = _.after 2, ->
            Cypress.abort()

          cy.on "retry", retry

          cy.on "fail", (err) ->
            done(err)

          cy.on "cancel", =>
            retry = @sandbox.spy cy, "_retry"
            _.delay ->
              expect(retry.callCount).to.eq 0
              done()
            , 100

          cy.ng("binding", "not-found")

    context "find by repeater", ->
      ngPrefixes = {"phone in phones": 'ng-', "phone2 in phones": 'ng_', "phone3 in phones": 'data-ng-', "phone4 in phones": 'x-ng-'}

      beforeEach ->
        ## make this test timeout quickly so
        ## we dont have to wait so damn long
        @loadDom("html/angular").then =>
          @setup()
          @currentTest.timeout(400)

      _.each ngPrefixes, (prefix, attr) ->
        it "finds by #{prefix}repeat", ->
          ## make sure we find this element
          li = cy.$("[#{prefix}repeat*='#{attr}']")
          expect(li).to.exist

          ## and make sure they are the same DOM element
          cy.ng("repeater", attr).then ($li) ->
            expect($li.get(0)).to.eq li.get(0)

      it "favors earlier items in the array when duplicates are found", ->
        li = cy.$("[ng-repeat*='foo in foos']")

        cy.ng("repeater", "foo in foos").then ($li) ->
          expect($li.get(0)).to.eq li.get(0)

      it "waits to find a missing input", ->
        missingLi = $("<li />", "data-ng-repeat": "li in lis")

        ## wait until we're ALMOST about to time out before
        ## appending the missingInput
        cy.on "retry", (options) ->
          if options.total + (options.interval * 3) > options.timeout
            cy.$("body").append(missingLi)

        cy.ng("repeater", "li in lis").then ($li) ->
          expect($li).to.match missingLi

      describe "errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it "throws when repeater cannot be found", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "Could not find element for repeater: 'not-found'.  Searched [ng-repeat*='not-found'], [ng_repeat*='not-found'], [data-ng-repeat*='not-found'], [x-ng-repeat*='not-found']."
            done()

          cy.ng("repeater", "not-found")

        it "cancels additional finds when aborted", (done) ->
          retry = _.after 2, ->
            Cypress.abort()

          cy.on "retry", retry

          cy.on "fail", (err) ->
            done(err)

          cy.on "cancel", =>

            retry = @sandbox.spy cy, "_retry"
            _.delay ->
              expect(retry.callCount).to.eq 0
              done()
            , 100

          cy.ng("repeater", "not-found")

        it "throws when cannot find angular", (done) ->
          delete cy.sync.window().angular

          cy.on "fail", (err) ->
            expect(err.message).to.include "Angular global (window.angular) was not found in your window! You cannot use .ng() methods without angular."
            done()

          cy.ng("repeater", "phone in phones")

    context "find by model", ->
      ngPrefixes = {query: 'ng-', query2: 'ng_', query3: 'data-ng-', query4: 'x-ng-'}

      beforeEach ->
        @loadDom("html/angular").then =>
          @setup()
          @currentTest.timeout(400)

      _.each ngPrefixes, (prefix, attr) ->
        it "finds element by #{prefix}model", ->
          ## make sure we find this element
          input = cy.$("[#{prefix}model=#{attr}]")
          expect(input).to.exist

          ## and make sure they are the same DOM element
          cy.ng("model", attr).then ($input) ->
            expect($input.get(0)).to.eq input.get(0)

      it "favors earlier items in the array when duplicates are found", ->
        input = cy.$("[ng-model=foo]")

        cy.ng("model", "foo").then ($input) ->
          expect($input.get(0)).to.eq input.get(0)

      it "waits to find a missing input", ->
        missingInput = $("<input />", "data-ng-model": "missing-input")

        ## wait until we're ALMOST about to time out before
        ## appending the missingInput
        cy.on "retry", (options) ->
          if options.total + (options.interval * 3) > options.timeout
            cy.$("body").append(missingInput)

        cy.ng("model", "missing-input").then ($input) ->
          expect($input).to.match missingInput

      it "cancels other retries when one resolves", ->
        _retry = @sandbox.spy cy, "_retry"

        missingInput = $("<input />", "data-ng-model": "missing-input")

        retry = _.after 6, _.once =>
          cy.$("body").append(missingInput)

        cy.on "retry", retry

        ## we want to make sure that the ng promises do not continue
        ## to retry after the first one resolves
        cy.inspect().ng("model", "missing-input").then ->
          _retry.reset()
        .wait(100).then ->
          expect(_retry.callCount).to.eq 0

      describe "errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it "throws when model cannot be found", (done) ->
          cy.ng("model", "not-found")

          cy.on "fail", (err) ->
            expect(err.message).to.include "Could not find element for model: 'not-found'.  Searched [ng-model='not-found'], [ng_model='not-found'], [data-ng-model='not-found'], [x-ng-model='not-found']."
            done()

        it "cancels additional finds when aborted", (done) ->
          retry = _.after 2, ->
            Cypress.abort()

          cy.on "retry", retry

          cy.on "fail", (err) ->
            done(err)

          cy.on "cancel", =>
            retry = @sandbox.spy cy, "_retry"
            _.delay ->
              expect(retry.callCount).to.eq 0
              done()
            , 100

          cy.ng("model", "not-found")

        it "throws when cannot find angular", (done) ->
          delete cy.sync.window().angular

          cy.on "fail", (err) ->
            expect(err.message).to.include "Angular global (window.angular) was not found in your window! You cannot use .ng() methods without angular."
            done()

          cy.ng("model", "query")

  context "#visit", ->
    it "returns a promise", ->
      promise = cy.command("visit", "/foo")
      expect(promise).to.be.instanceOf(Promise)

    it "triggers visit:start on the remote iframe", (done) ->
      $("iframe").one "visit:start", (e, url) ->
        expect(url).to.eq "/foo"
        done()

      cy.visit("/foo")

    it "resolves the subject to the remote iframe window", ->
      cy.visit("/foo").then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

    it "changes the src of the iframe to the initial src", ->
      cy.visit("/foo").then ->
        src = $("iframe").attr("src")
        expect(src).to.eq "/__remote/foo/?__initial=true"

    it "immediately updates the stored href on load", (done) ->
      _storeHref = @sandbox.spy cy, "_storeHref"

      cy.on "invoke:subject", (subject, obj) ->
        expect(_storeHref.callCount).to.eq 2
        done()

      cy.visit("/foo")

    it "prevents _hrefChanged from always being true after visiting", (done) ->
      cy.on "invoke:subject", (subject, obj) ->
        expect(cy._hrefChanged()).to.be.false
        done()

      cy.visit("/foo")

    it "rejects the promise if data-cypress-visit-error is in the body"

    it "rejects with error: ...something..."

    it "extends the runnables timeout before visit"

    it "resets the runnables timeout after visit"

    it "invokes onLoad callback"
    it "invokes onBeforeLoad callback"

  context "#eval", ->
    beforeEach ->
      @server = @sandbox.useFakeServer()
      @server.autoRespond = true
      @server.respondWith /eval/, JSON.stringify({foo: "bar"})

    it "changes the subject to the response", ->
      cy.eval("foo()").then (resp) ->
        expect(resp).to.deep.eq {foo: "bar"}

    it "updates the timeout?"

    it "retains the current xhr", ->
      cy.eval("foo()").then ->
        expect(cy.prop("xhr").responseText).to.eq @server.requests[0].responseText

    it "aborts any existing xhr?"

    it "removes the current xhr on success?"

  context "#url", ->
    it "returns the location href", ->
      cy.url().then (url) ->
        expect(url).to.eq "/fixtures/html/dom.html"

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>
          if @log.get("name") is "location"
            throw new Error("cy.location() should not have logged out.")

      afterEach ->
        delete @log

      it "ends immediately", ->
        cy.url().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("success")

      it "snapshots immediately", ->
        cy.url().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs obj", ->
        cy.url().then ->
          obj = {
            name: "url"
            message: "/fixtures/html/dom.html"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "does not emit when {log: false}", ->
        cy.url({log: false}).then ->
          expect(@log).to.be.undefined

      it "#onConsole", ->
        cy.url().then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "url"
            Returned: "/fixtures/html/dom.html"
          }

  context "#hash", ->
    it "returns the location hash", ->
      cy.hash().then (hash) ->
        expect(hash).to.eq ""

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>
          if @log.get("name") is "location"
            throw new Error("cy.location() should not have logged out.")

      afterEach ->
        delete @log

      it "ends immediately", ->
        cy.hash().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("success")

      it "snapshots immediately", ->
        cy.hash().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs obj", ->
        cy.hash().then ->
          obj = {
            name: "hash"
            message: ""
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "does not emit when {log: false}", ->
        cy.hash({log: false}).then ->
          expect(@log).to.be.undefined

      it "#onConsole", ->
        cy.hash().then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "hash"
            Returned: ""
          }

  context "#location", ->
    it "returns the location object", ->
      cy.location().then (loc) ->
        keys = _.keys loc
        expect(keys).to.deep.eq ["hash", "href", "host", "hostname", "origin", "pathname", "port", "protocol", "search", "toString"]

    it "returns a specific key from location object", ->
      cy.location("href").then (href) ->
        expect(href).to.eq "/fixtures/html/dom.html"

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      afterEach ->
        delete @log

      it "ends immediately", ->
        cy.location("href").then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("success")

      it "snapshots immediately", ->
        cy.location("href").then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "does not emit when {log: false} as options", ->
        cy.location("href", {log: false}).then ->
          expect(@log).to.be.undefined

      it "does not emit when {log: false} as key", ->
        cy.location({log: false}).then ->
          expect(@log).to.be.undefined

      it "logs obj without a message", ->
        cy.location().then ->
          obj = {
            name: "location"
            message: null
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "logs obj with a message", ->
        cy.location("origin").then ->
          obj = {
            name: "location"
            message: "origin"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#onConsole", ->
        cy.location().then ->
          onConsole = @log.attributes.onConsole()

          expect(_(onConsole).keys()).to.deep.eq ["Command", "Returned"]
          expect(onConsole.Command).to.eq "location"
          expect(_(onConsole.Returned).keys()).to.deep.eq ["hash", "href", "host", "hostname", "origin", "pathname", "port", "protocol", "search", "toString"]

  context "#window", ->
    it "returns the remote window", ->
      cy.window().then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

  context "#document", ->
    it "returns the remote document as a jquery object", ->
      cy.document().then ($doc) ->
        expect($doc.get(0)).to.eq $("iframe").prop("contentDocument")

    it "aliases doc to document", ->
      cy.doc().then ($doc) ->
        expect($doc.get(0)).to.eq $("iframe").prop("contentDocument")

  context "#title", ->
    it "returns the pages title as a string", ->
      title = cy.$("title").text()
      cy.title().then (text) ->
        expect(text).to.eq title

    it "retries finding the title", ->
      cy.$("title").remove()

      retry = _.after 2, ->
        cy.$("head").append $("<title>waiting on title</title>")

      cy.on "retry", retry

      cy.title().then (text) ->
        expect(text).to.eq "waiting on title"

    it "retries until it has the correct title", ->
      cy.$("title").text("home page")

      retry = _.after 2, ->
        cy.$("title").text("about page")

      cy.on "retry", retry

      cy.inspect().title().until (title) ->
        expect(title).to.eq "about page"

    it "throws after timing out", (done) ->
      @sandbox.stub cy.runner, "uncaught"
      @test.timeout(300)
      cy.$("title").remove()
      cy.title()
      cy.on "fail", (err) ->
        expect(err.message).to.include "Could not find element: title"
        done()

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>
          if @log.get("name") is "get"
            throw new Error("cy.get() should not have logged out.")

      it "logs immediately before resolving", (done) ->
        input = cy.$(":text:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "title"
            expect(log.get("state")).to.eq("pending")
            done()

        cy.title()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.title().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs obj", ->
        cy.title().then ->
          obj = {
            name: "title"
            message: "DOM Fixture"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#onConsole", ->
        cy.title().then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "title"
            Returned: "DOM Fixture"
          }

  context "#fill", ->
    it "requires an object literal", (done) ->
      @sandbox.stub cy.runner, "uncaught"

      cy.get("form").fill("")

      cy.on "fail", (err) ->
        expect(err.message).to.include "cy.fill() must be passed an object literal as its 1st argument!"
        done()

  context "#within", ->
    it "scopes additional GET finders to the subject", ->
      input = cy.$("#by-name input:first")

      cy.get("#by-name").within ->
        cy.get("input:first").then ($input) ->
          expect($input.get(0)).to.eq input.get(0)

    it "scopes additional CONTAINS finders to the subject", ->
      span = cy.$("#nested-div span:contains(foo)")

      cy.contains("foo").then ($span) ->
        expect($span.get(0)).not.to.eq span.get(0)

      cy.get("#nested-div").within ->
        cy.contains("foo").then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

    it "does not change the subject", ->
      form = cy.$("#by-name")

      cy.get("#by-name").within(->).then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "can call child commands after within on the same subject", ->
      input = cy.$("#by-name input:first")

      cy.get("#by-name").within(->).find("input:first").then ($input) ->
        expect($input.get(0)).to.eq input.get(0)

    it "supports nested withins", ->
      span = cy.$("#button-text button span")

      cy.get("#button-text").within ->
        cy.get("button").within ->
          cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span.get(0)

    it "supports complicated nested withins", ->
      span1 = cy.$("#button-text a span")
      span2 = cy.$("#button-text button span")

      cy.get("#button-text").within ->
        cy.get("a").within ->
          cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span1.get(0)

        cy.get("button").within ->
          cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span2.get(0)

    it "clears withinSubject after within is over", ->
      input = cy.$("input:first")
      span = cy.$("#button-text button span")

      cy.get("#button-text").within ->
        cy.get("button").within ->
          cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span.get(0)

      cy.get("input:first").then ($input) ->
        expect($input.get(0)).to.eq input.get(0)

    it "removes command:start listeners after within is over", ->
      cy.get("#button-text").within ->
        cy.get("button").within ->
          cy.get("span")

      cy.then ->
        expect(cy._events).not.to.have.property "command:start"

    it "clears withinSubject even if next is null", (done) ->
      span = cy.$("#button-text button span")

      cy.on "end", ->
        ## should be defined here because next would have been
        ## null and withinSubject would not have been cleared
        expect(cy.prop("withinSubject")).not.to.be.undefined

        _.defer ->
          expect(cy.prop("withinSubject")).to.be.null
          done()

      cy.get("#button-text").within ->
        cy.get("button span").then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

    describe ".log", ->
      it "logs immediately before resolving", (done) ->
        div = cy.$("div:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "within"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("")
            expect(log.get("$el").get(0)).to.eq div.get(0)
            done()

        cy.get("div:first").within ->

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get("div:first").within ->
          cy.then ->
            expect(@log.get("snapshot")).to.be.an("object")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.noop().within ->

      it "throws when not a DOM subject", (done) ->
        cy.on "fail", (err) -> done()

        cy.noop().within ->

      _.each ["", [], {}, 1, null, undefined], (value) ->
        it "throws if passed anything other than a function, such as: #{value}", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "cy.within() must be called with a function!"
            done()

          cy.get("body").within(value)

  context "#fail", ->
    it "passes err to runner.uncaught", ->
      uncaught = @sandbox.stub cy.runner, "uncaught"

      err = new Error
      cy.fail(err)
      expect(uncaught).to.be.calledWith err

    it "calls #fail on error", (done) ->
      @sandbox.stub cy.runner, "uncaught"

      cy.on "command:start", ->
        @_timeout(100)

      cy.on "fail", -> done()

      cy.get("foo")

    it "has an err.name of CypressError", ->
      try
        cy.throwErr("foo")
      catch e
        expect(e.name).to.eq "CypressError"

    context "command error bubbling", ->
      beforeEach ->
        @uncaught = @sandbox.stub(cy.runner, "uncaught")

      it "does not emit command:end when a command fails", (done) ->
        cy.then ->
          trigger = @sandbox.spy cy, "trigger"

          _.defer ->
            expect(trigger).not.to.be.calledWith("command:end")
            done()
          throw new Error("err")

      it "emits fail and passes up err", (done) ->
        err = null
        cy.then ->
          err = new Error("err")
          throw err

        cy.on "fail", (e) ->
          expect(e).to.eq err
          done()

      it "passes the full stack trace to mocha", (done) ->
        err = null
        cy.then ->
          err = new Error("err")
          throw err

        cy.on "fail", (e) =>
          expect(@uncaught).to.be.calledWith(err)
          done()

  context "#save", ->
    it "does not change the subject", ->
      cy.noop({}).assign("obj").then (obj) ->
        expect(obj).to.deep.eq {}

    it "saves the subject in the runnables ctx", ->
      cy.noop({}).assign("obj").then ->
        expect(@obj).to.deep.eq {}

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "is a child command", (done) ->
        cy.on "fail", -> done()
        cy.assign("foo")

      it "throws when str is blank", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.assign() cannot be passed an empty argument!"
          done()

        cy.noop({}).assign("")

      _.each [[], {}, /foo/, NaN], (val) ->
        it "throws when str is: #{val}", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "cy.assign() can only accept a string or number!"
            done()

          cy.noop({}).assign(val)

  context "#as", ->
    it "does not change the subject", ->
      body = cy.$("body")

      cy.get("body").as("b").then ($body) ->
        expect($body.get(0)).to.eq body.get(0)

    it "stores the lookup as an alias", ->
      cy.get("body").as("b").then ->
        expect(cy._aliases.b).to.be.defined

    it "stores the resulting subject as the alias", (done) ->
      body = cy.$("body")

      cy.on "end", ->
        expect(cy._aliases.b.subject.get(0)).to.eq body.get(0)
        done()

      cy.get("body").as("b")

    it "stores subject of chained aliases", ->
      li = cy.$("#list li").eq(0)

      cy.get("#list li").eq(0).as("firstLi").then ($li) ->
        expect($li).to.match li

  context "#getAlias", ->
    it "retrieves aliases", ->
      cy.on "end", ->
        expect(cy.getAlias("@firstInput")).to.be.defined

      cy
        .get("body").as("b")
        .get("input:first").as("firstInput")
        .get("div:last").as("lastDiv")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when an alias cannot be found", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.get() could not find a registered alias for: 'lastDiv'.  Available aliases are: 'b, firstInput'."
          done()

        cy
          .get("body").as("b")
          .get("input:first").as("firstInput")
          .get("@lastDiv")

      it "throws when alias is missing '@' but matches an available alias", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "Invalid alias: 'getAny'. You forgot the '@'. It should be written as: '@getAny'."
          done()

        cy
          .server()
          .route("*", {}).as("getAny")
          .wait("getAny").then ->

  context "#_replayFrom", ->
    describe "subject in document", ->
      it "returns if subject is still in the document", (done) ->
        cy.on "end", ->
          expect(cy.queue.length).to.eq 3
          done()

        cy
          .get("#list").as("list")
          .get("@list")

    describe "subject not in document", ->
      it "inserts into the queue", (done) ->
        cy.on "end", ->
          expect(getNames(cy.queue)).to.deep.eq(
            ["get", "eq", "as", "then", "get", "get", "eq"]
          )
          done()

        cy
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            $li.remove()
          .get("@firstLi")

      it "replays from last root to current", ->
        first = cy.$("#list li").eq(0)
        second = cy.$("#list li").eq(1)

        cy
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            expect($li.get(0)).to.eq first.get(0)
            $li.remove()
          .get("@firstLi").then ($li) ->
            expect($li.get(0)).to.eq second.get(0)

      it "replays up until first root command", (done) ->
        cy.on "end", ->
          expect(getNames(cy.queue)).to.deep.eq(
            ["get", "noop", "get", "eq", "as", "then", "get", "get", "eq"]
          )
          done()

        cy
          .get("body").noop({})
          .get("#list li").eq(0).as("firstLi").then ($li) ->
            $li.remove()
          .get("@firstLi")

  context "#end", ->
    it "nulls out the subject", ->
      cy.noop({}).end().then (subject) ->
        expect(subject).to.be.null

  context "#root", ->
    it "returns html", ->
      html = cy.$("html")

      cy.root().then ($html) ->
        expect($html.get(0)).to.eq html.get(0)

    it "returns withinSubject if exists", ->
      form = cy.$("form")

      cy.get("form").within ->
        cy
          .get("input")
          .root().then ($root) ->
            expect($root.get(0)).to.eq form.get(0)

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        Cypress.on "log", (log) ->
          if log.get("name") is "root"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("")
            done()

        cy.root()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.root().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "sets $el to document", ->
        html = cy.$("html")

        cy.root().then ->
          expect(@log.get("$el").get(0)).to.eq(html.get(0))

      it "sets $el to withinSubject", ->
        form = cy.$("form")

        cy.get("form").within ->
          cy
            .get("input")
            .root().then ($root) ->
              expect(@log.get("$el").get(0)).to.eq(form.get(0))

  context "#get", ->
    beforeEach ->
      ## make this test timeout quickly so
      ## we dont have to wait so damn long
      @currentTest.timeout(300)

    it "finds by selector", ->
      list = cy.$("#list")

      cy.get("#list").then ($list) ->
        expect($list).to.match list

    it "retries finding elements until something is found", ->
      missingEl = $("<div />", id: "missing-el")

      ## wait until we're ALMOST about to time out before
      ## appending the missingEl
      cy.on "retry", (options) ->
        if options.total + (options.interval * 3) > options.timeout
          cy.$("body").append(missingEl)

      cy.get("#missing-el").then ($div) ->
        expect($div).to.match missingEl

    it "retries until .until resolves to true", ->
      retry = _.after 3, ->
        cy.$("#list li").last().remove()

      cy.on "retry", retry

      cy.get("#list li").until ($list) ->
        expect($list.length).to.eq 2

    it "does not throw when could not find element and was told not to retry", ->
      cy.get("#missing-el", {retry: false}).then ($el) ->
        expect($el).not.to.exist

    _.each ["exist", "exists"], (key) ->
      describe "{#{key}: false}", ->
        it "returns null when cannot find element", ->
          options = {}
          options[key] = false
          cy.get("#missing-el", options).then ($el) ->
            expect($el).to.be.null

        it "retries until cannot find element", ->
          ## add 500ms to the delta
          cy._timeout(500, true)

          retry = _.after 3, ->
            cy.$("#list li:last").remove()

          cy.on "retry", retry

          options = {}
          options[key] = false
          cy.get("#list li:last", options).then ($el) ->
            expect($el).to.be.null

    describe "{visible: null}", ->
      it "finds invisible elements by default", ->
        button = cy.$("#button").hide()

        cy.get("#button").then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe "{visible: false}", ->
      it "returns invisible element", ->
        button = cy.$("#button").hide()

        cy.get("#button", {visible: false}).then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

      it "retries until element is invisible", ->
        ## add 500ms to the delta
        cy._timeout(500, true)

        button = null

        retry = _.after 3, ->
          button = cy.$("#button").hide()

        cy.on "retry", retry

        cy.get("#button", {visible: false}).then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe "{visible: true}", ->
      it "returns visible element", ->
        button = cy.$("#button")

        cy.get("#button", {visible: true}).then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

      it "retries until element is visible", ->
        ## add 500ms to the delta
        cy._timeout(500, true)

        button = cy.$("#button").hide()

        retry = _.after 3, ->
          button.show()

        cy.on "retry", retry

        cy.get("#button", {visible: true}).then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        Cypress.on "log", (log) ->
          expect(log.pick("state", "referencesAlias", "aliasType")).to.deep.eq {
            state: "pending"
            referencesAlias: undefined
            aliasType: "dom"
          }
          done()

        cy.get("body")

      it "logs obj once complete", ->
        cy.get("body").as("b").then ($body) ->
          obj = {
            state: "success"
            name: "get"
            message: "body"
            alias: "b"
            aliasType: "dom"
            referencesAlias: undefined
            $el: $body
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "#onConsole", ->
        cy.get("body").then ($body) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "get"
            Selector: "body"
            Returned: $body
            Elements: 1
          }

      it "#onConsole with an alias", ->
        cy.get("body").as("b").get("@b").then ($body) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "get"
            Alias: "@b"
            Returned: $body
            Elements: 1
          }

    describe "alias references", ->
      it "re-queries for an existing alias", ->
        body = cy.$("body")

        cy.get("body").as("b").get("@b").then ($body) ->
          expect($body.get(0)).to.eq body.get(0)

      it "re-queries the dom if any element in an alias isnt in the document", ->
        inputs = cy.$("input")

        cy
          .get("input").as("inputs").then ($inputs) ->
            @length = $inputs.length

            ## remove the last input
            $inputs.last().remove()

            ## return original subject
            return $inputs
          .get("@inputs").then ($inputs) ->
            ## we should have re-queried for these inputs
            ## which should have reduced their length by 1
            expect($inputs).to.have.length(@length - 1)

      # it "re-queries the dom if any element in an alias isnt visible", ->
      #   inputs = cy.$("input")
      #   inputs.hide()

      #   cy
      #     .get("input", {visible: false}).as("inputs").then ($inputs) ->
      #       @length = $inputs.length

      #       ## show the inputs
      #       $inputs.show()

      #       return $inputs
      #     .get("@inputs").then ($inputs) ->
      #       ## we should have re-queried for these inputs
      #       ## which should have increased their length by 1
      #       expect($inputs).to.have.length(@length)

      ## these other tests are for .save
      # it "will resolve deferred arguments", ->
      #   df = $.Deferred()

      #   _.delay ->
      #     df.resolve("iphone")
      #   , 100

      #   cy.get("input:text:first").type(df).then ($input) ->
      #     expect($input).to.have.value("iphone")

      # it "handles saving subjects", ->
      #   cy.noop({foo: "foo"}).assign("foo").noop(cy.get("foo")).then (subject) ->
      #     expect(subject).to.deep.eq {foo: "foo"}

      # it "resolves falsy arguments", ->
      #   cy.noop(0).assign("zero").then ->
      #     expect(cy.get("zero")).to.eq 0

      # it "returns a function when no alias was found", ->
      #   cy.noop().then ->
      #     expect(cy.get("something")).to.be.a("function")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws after timing out not finding element", (done) ->
        cy.get("#missing-el")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find element: #missing-el"
          done()

      it "throws when using an alias that does not exist"

      it "throws after timing out after a .wait() alias reference", (done) ->
        cy.$("#get-json").click ->
          cy._timeout(1000)

          retry = _.after 3, _.once ->
            cy.sync.window().$.getJSON("/json")

          cy.on "retry", retry

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find element: getJsonButton"
          done()

        cy
          .server()
          .route(/json/, {foo: "foo"}).as("getJSON")
          .get("#get-json").as("getJsonButton").click()
          .wait("@getJSON")
          .get("getJsonButton")

      it "throws after timing out while not trying to find an element", (done) ->
        cy.get("div:first", {exist: false})

        cy.on "fail", (err) ->
          expect(err.message).to.include "Found existing element: div:first"
          done()

      it "throws after timing out while trying to find an invisible element", (done) ->
        cy.get("div:first", {visible: false})

        cy.on "fail", (err) ->
          expect(err.message).to.include "Found visible element: div:first"
          done()

      it "throws after timing out trying to find a visible element", (done) ->
        cy.$("#button").hide()

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find visible element: #button"
          done()

        cy.get("#button", {visible: true})

      it "sets error command state", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq "error"
          expect(@log.get("error")).to.eq err
          done()

        cy.get("foobar")

  context "#contains", ->
    it "finds the nearest element by :contains selector", ->
      cy.contains("li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("li")

    it "resets the subject between chain invocations", ->
      span = cy.$(".k-in:contains(Quality Control):last")
      label = cy.$("#complex-contains label")

      cy.get("#complex-contains").contains("nested contains").then ($label) ->
        expect($label.get(0)).to.eq label.get(0)
        return $label
      cy.contains("Quality Control").then ($span) ->
        expect($span.get(0)).to.eq span.get(0)

    it "GET is scoped to the current subject", ->
      span = cy.$("#click-me a span")

      cy.get("#click-me a").contains("click").then ($span) ->
        expect($span.length).to.eq(1)
        expect($span.get(0)).to.eq span.get(0)

    it "can find input type=submits by value", ->
      cy.contains("input contains submit").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match "input[type=submit]"

    it "has an optional filter argument", ->
      cy.contains("ul", "li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("ul")

    it "disregards priority elements when provided a filter", ->
      form = cy.$("#click-me")

      cy.contains("form", "click me").then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "favors input type=submit", ->
      cy.contains("click me").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("input[type=submit]")

    it "favors buttons next", ->
      cy.contains("click button").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("button")

    it "favors anchors next", ->
      cy.contains("Home Page").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("a")

    it "reduces right by priority element", ->
      label = cy.$("#complex-contains label")

      ## it should find label because label is the first priority element
      ## out of the collection of contains elements
      cy.get("#complex-contains").contains("nested contains").then ($label) ->
        expect($label.get(0)).to.eq label.get(0)

    it "retries until content is found", ->
      span = $("<span>brand new content</span>")

      ## only append the span after we retry
      ## three times
      retry = _.after 3, ->
        cy.$("body").append span

      cy.on "retry", retry

      cy.contains("brand new content").then ($span) ->
        expect($span.get(0)).to.eq span.get(0)

    it "finds the furthest descendent when filter matches more than 1 element", ->
      cy
        .get("#contains-multiple-filter-match").contains("li", "Maintenance").then ($row) ->
          expect($row).to.have.class("active")

    describe "{exist: false}", ->
      it "returns null when no content exists", ->
        cy.contains("alksjdflkasjdflkajsdf", {exist: false}).then ($el) ->
          expect($el).to.be.null

    describe "{visible: false}", ->
      it "returns invisible element", ->
        span = cy.$("#not-hidden").hide()

        cy.contains("span", "my hidden content", {visible: false}).then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

    describe "subject contains text nodes", ->
      it "searches for content within subject", ->
        badge = cy.$("#edge-case-contains .badge:contains(5)")

        cy.get("#edge-case-contains").find(".badge").contains(5).then ($badge) ->
          expect($badge.get(0)).to.eq badge.get(0)

      it "returns the first element when subject contains multiple elements", ->
        badge = cy.$("#edge-case-contains .badge-multi:contains(1)")

        cy.get("#edge-case-contains").find(".badge-multi").contains(1).then ($badge) ->
          expect($badge.length).to.eq(1)
          expect($badge.get(0)).to.eq badge.get(0)

      it "returns the subject when it has a text node of matching content", ->
        count = cy.$("#edge-case-contains .count:contains(2)")

        cy.get("#edge-case-contains").find(".count").contains(2).then ($count) ->
          expect($count.length).to.eq(1)
          expect($count.get(0)).to.eq count.get(0)

      it "retries until it finds the subject has the matching text node", (done) ->
        count = $("<span class='count'>100</span>")

        ## make sure it retries 3 times!
        retry = _.after 3, ->
          cy.$("#edge-case-contains").append(count)

          cy.chain().then ($count) ->
            expect($count.length).to.eq(1)
            expect($count.get(0)).to.eq count.get(0)
            done()

        cy.on "retry", retry

        cy.get("#edge-case-contains").contains(100)

      it "retries until it finds a filtered contains has the matching text node", (done) ->
        count = $("<span class='count'>100</span>")

        retry = _.after 3, ->
          cy.$("#edge-case-contains").append(count)

          cy.chain().then ($count) ->
            expect($count.length).to.eq(1)
            expect($count.get(0)).to.eq count.get(0)
            done()

        cy.on "retry", retry

        cy.get("#edge-case-contains").contains(".count", 100)

      it "returns the first matched element when multiple match and there is no filter", ->
        icon = cy.$("#edge-case-contains i:contains(25)")

        cy.get("#edge-case-contains").contains(25).then ($icon) ->
          expect($icon.length).to.eq(1)
          expect($icon.get(0)).to.eq icon.get(0)

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        Cypress.on "log", (log) ->
          if log.get("name") is "contains"
            expect(log.pick("state", "type")).to.deep.eq {
              state: "pending"
              type: "child"
            }
            done()

        cy.get("body").contains("foo")

      it "snapshots after finding element", ->
        Cypress.on "log", (@log) =>

        cy.contains("foo").then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "silences internal cy.get() log", ->
        logs = []

        Cypress.on "log", (log) ->
          logs.push log

        ## GOOD: [ {name: get} , {name: contains} ]
        ## BAD:  [ {name: get} , {name: get} , {name: contains} ]
        cy.get("#complex-contains").contains("nested contains").then ($label) ->
          names = _(logs).map (log) -> log.get("name")
          expect(logs).to.have.length(2)
          expect(names).to.deep.eq ["get", "contains"]

      it "passes in $el", ->
        cy.get("#complex-contains").contains("nested contains").then ($label) ->
          expect(@log.get("$el")).to.eq $label

      it "sets type to parent when used as a parent command", ->
        cy.contains("foo").then ->
          expect(@log.get("type")).to.eq "parent"

      it "sets type to parent when subject doesnt have an element", ->
        cy.noop({}).contains("foo").then ->
          expect(@log.get("type")).to.eq "parent"

      it "sets type to child when used as a child command", ->
        cy.get("body").contains("foo").then ->
          expect(@log.get("type")).to.eq "child"

      it "#onConsole", ->
        cy.get("#complex-contains").contains("nested contains").then ($label) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "contains"
            Content: "nested contains"
            "Applied To": getFirstSubjectByName("get")
            Returned: $label
            Elements: 1
          }

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"
        @currentTest.timeout(300)

      it "throws when there is a filter", (done) ->
        cy.contains("span", "brand new content")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any content: 'brand new content' within the selector: 'span'"
          done()

      it "throws when there is no filter and no subject", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any content: 'brand new content' in any elements"
          done()

        cy.contains("brand new content")

      it "throws when there is no filter but there is a subject", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any content: '0' within the element: <div.badge>"
          done()

        cy.get("#edge-case-contains").find(".badge").contains(0)

      it "throws when there is a no filter but there is a multi subject", (done) ->
        cy.contains("brand new content")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any content: 'brand new content' in any elements"
          done()

      it "throws after timing out while not trying to find an element that contains content", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "Found content: 'button' within any existing elements"
          done()

        cy.contains("button", {exist:false})

  context "#select", ->
    it "does not change the subject", ->
      select = cy.$("select[name=maps]")

      cy.get("select[name=maps]").select("train").then ($select) ->
        expect($select).to.match select

    it "selects by value", ->
      cy.get("select[name=maps]").select("de_train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "selects by text", ->
      cy.get("select[name=maps]").select("train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "prioritizes value over text", ->
      cy.get("select[name=foods]").select("Ramen").then ($select) ->
        expect($select).to.have.value("Ramen")

    it "can select an array of values", ->
      cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "can select an array of texts", ->
      cy.get("select[name=movies]").select(["The Human Condition", "There Will Be Blood"]).then ($select) ->
        expect($select.val()).to.deep.eq ["thc", "twbb"]

    it "clears previous values when providing an array", ->
      ## make sure we have a previous value
      select = cy.$("select[name=movies]").val(["2001"])
      expect(select.val()).to.deep.eq ["2001"]

      cy.get("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.noop({}).select("foo")

        cy.on "fail", -> done()

      it "throws when more than 1 element in the collection", (done) ->
        cy
          .get("select").then ($selects) ->
            @num = $selects.length
            return $selects
          .select("foo")

        cy.on "fail", (err) =>
          expect(err.message).to.include ".select() can only be called on a single <select>! Your subject contained #{@num} elements!"
          done()

      it "throws on anything other than a select", (done) ->
        cy.get("input:first").select("foo")

        cy.on "fail", (err) ->
          expect(err.message).to.include ".select() can only be called on a <select>! Your subject is a: <input id=\"input\">"
          done()

      it "throws when finding duplicate values", (done) ->
        cy.get("select[name=names]").select("bm")

        cy.on "fail", (err) ->
          expect(err.message).to.include ".select() matched than one option by value or text: bm"
          done()

      it "throws when passing an array to a non multiple select", (done) ->
        cy.get("select[name=names]").select(["bm", "ss"])

        cy.on "fail", (err) ->
          expect(err.message).to.include ".select() was called with an array of arguments but does not have a 'multiple' attribute set!"
          done()

      it "throws when the subject isnt visible", (done) ->
        select = cy.$("select:first").show().hide()

        node = Cypress.Utils.stringifyElement(select)

        cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.select() cannot be called on the non-visible element: #{node}"
          done()

        cy.get("select:first").select("foo")

  context "#type", ->
    it "does not change the subject", ->
      input = cy.$("input:first")

      cy.get("input:first").type("foo").then ($input) ->
        expect($input).to.match input

    it "changes the value", ->
      input = cy.$("input:text:first")

      input.val("")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("")

      cy.get("input:text:first").type("foo").then ($input) ->
        expect($input).to.have.value("foo")

    it "appends to a current value", ->
      input = cy.$("input:text:first")

      input.val("foo")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("foo")

      cy.get("input:text:first").type(" bar").then ($input) ->
        expect($input).to.have.value("foo bar")

    it "triggers focus event on the input", (done) ->
      cy.$("input:text:first").focus -> done()

      cy.get("input:text:first").type("bar")

    it "lists the input as the focused element", ->
      input = cy.$("input:text:first")

      cy.get("input:text:first").type("bar").focused().then ($focused) ->
        expect($focused.get(0)).to.eq input.get(0)

    it "causes previous input to receive blur", (done) ->
      cy.$("input:text:first").blur -> done()

      cy
        .get("input:text:first").type("foo")
        .get("input:text:last").type("bar")

    describe "input types", ->
      _.each ["password", "email", "number", "date", "week", "month", "time", "datetime", "datetime-local", "search", "url"], (type) ->
        it "accepts input [type=#{type}]", ->
          input = cy.$("<input type='#{type}' id='input-type-#{type}' />")

          cy.$("body").append(input)

          cy.get("#input-type-#{type}").type("1234").then ($input) ->
            expect($input.get(0)).to.eq input.get(0)

    describe "{enter}", ->
      beforeEach ->
        @forms = cy.$("#form-submits")

      context "1 input, no 'submit' elements", ->
        it "triggers form submit", (done) ->
          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#single-input input").type("foo{enter}")

        it "triggers form submit synchronously before type logs or resolves", ->
          events = []

          cy.on "invoke:start", (obj) ->
            events.push "#{obj.name}:start"

          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            events.push "submit"

          Cypress.on "log", (log) ->
            state = log.get("state")

            if state is "pending"
              log.on "state:changed", (state) ->
                events.push "#{log.get('name')}:log:#{state}"

              events.push "#{log.get('name')}:log:#{state}"

          cy.on "invoke:end", (obj) ->
            events.push "#{obj.name}:end"

          cy.get("#single-input input").type("f{enter}").then ->
            expect(events).to.deep.eq [
              "get:start", "get:log:pending", "get:end", "type:start", "type:log:pending", "submit", "type:end", "then:start"
            ]

        it "triggers 2 form submit event", ->
          submits = 0

          @forms.find("#single-input").submit (e) ->
            e.preventDefault()
            submits += 1

          cy.get("#single-input input").type("f{enter}{enter}").then ->
            expect(submits).to.eq 2

        it "unbinds from form submit event", ->
          submits = 0

          form = @forms.find("#single-input").submit ->
            submits += 1

          cy.get("#single-input input").type("f{enter}{enter}").then ->
            ## simulate another enter event which should not issue another
            ## submit event because we should have cleaned up the events
            form.find("input").simulate "key-sequence", sequence: "b{enter}"
            expect(submits).to.eq 2

        it "does not submit when keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("input").keydown (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keydown is defaultPrevented on wrapper", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("div").keydown (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keydown is defaultPrevented on form", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.keydown (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on input", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on wrapper", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.find("div").keypress (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

        it "does not submit when keypress is defaultPrevented on form", (done) ->
          form = @forms.find("#single-input").submit -> done("err: should not have submitted")
          form.keypress (e) -> e.preventDefault()

          cy.get("#single-input input").type("f").type("f{enter}").then -> done()

      context "2 inputs, no 'submit' elements", ->
        it "does not trigger submit event", (done) ->
          form = @forms.find("#no-buttons").submit -> done("err: should not have submitted")

          cy.get("#no-buttons input:first").type("f").type("{enter}").then -> done()

      context "2 inputs, no 'submit' elements but 1 button[type=button]", ->
        it "does not trigger submit event", (done) ->
          form = @forms.find("#one-button-type-button").submit -> done("err: should not have submitted")

          cy.get("#one-button-type-button input:first").type("f").type("{enter}").then -> done()

      context "2 inputs, 1 'submit' element input[type=submit]", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-input-submit").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}")

        it "causes click event on the input[type=submit]", (done) ->
          @forms.find("#multiple-inputs-and-input-submit input[type=submit]").click -> done()

          cy.get("#multiple-inputs-and-input-submit input:first").type("foo{enter}")

        it "does not cause click event on the input[type=submit] if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-input-submit").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#multiple-inputs-and-input-submit input:first").type("f{enter}").then -> done()

      context "2 inputs, 1 'submit' element button[type=submit]", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-button-submit").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}")

        it "causes click event on the button[type=submit]", (done) ->
          @forms.find("#multiple-inputs-and-button-submit button[type=submit]").click -> done()

          cy.get("#multiple-inputs-and-button-submit input:first").type("foo{enter}")

        it "does not cause click event on the button[type=submit] if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-button-submit").submit ->
            done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#multiple-inputs-and-button-submit input:first").type("f{enter}").then -> done()

      context "2 inputs, 1 'submit' element button", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-button-with-no-type").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}")

        it "causes click event on the button", (done) ->
          @forms.find("#multiple-inputs-and-button-with-no-type button").click -> done()

          cy.get("#multiple-inputs-and-button-with-no-type input:first").type("foo{enter}")

        it "does not cause click event on the button if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-button-with-no-type").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#multiple-inputs-and-button-with-no-type input:first").type("f{enter}").then -> done()

      context "2 inputs, 2 'submit' elements", ->
        it "triggers form submit", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits").submit (e) ->
            e.preventDefault()
            done()

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}")

        it "causes click event on the button", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits button").click -> done()

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}")

        it "does not cause click event on the button if keydown is defaultPrevented on input", (done) ->
          form = @forms.find("#multiple-inputs-and-multiple-submits").submit -> done("err: should not have submitted")
          form.find("input").keypress (e) -> e.preventDefault()

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("f{enter}").then -> done()

      context "disabled default button", ->
        beforeEach ->
          @forms.find("#multiple-inputs-and-multiple-submits").find("button").prop("disabled", true)

        it "will not receive click event", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits button").click -> done("err: should not receive click event")

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then -> done()

        it "will not submit the form", (done) ->
          @forms.find("#multiple-inputs-and-multiple-submits").submit -> done("err: should not receive submit event")

          cy.get("#multiple-inputs-and-multiple-submits input:first").type("foo{enter}").then -> done()

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "passes in $el", ->
        cy.get("input:first").type("foobar").then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "#onConsole", ->
        cy.get("input:first").type("foobar").then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "type"
            Typed: "foobar"
            "Applied To": $input
          }

      it "logs only one type event", ->
        logs = []
        types = []

        Cypress.on "log", (log) ->
          logs.push(log)
          types.push(log) if log.get("name") is "type"

        cy.get(":text:first").type("foo").then ->
          expect(logs).to.have.length(2)
          expect(types).to.have.length(1)

      it "logs immediately before resolving", (done) ->
        input = cy.$(":text:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "type"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        cy.get(":text:first").type("foo")

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get(":text:first").type("foo").then ->
          expect(@log.get("snapshot")).to.be.an("object")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.noop({}).type("foo")

        cy.on "fail", -> done()

      it "throws when not textarea or :text", (done) ->
        cy.get("form").type("foo")

        cy.on "fail", (err) ->
          expect(err.message).to.include ".type() can only be called on textarea or :text! Your subject is a: <form id=\"by-id\"></form>"
          done()

      it "throws when subject is a collection of elements", (done) ->
        cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .type("foo")

        cy.on "fail", (err) =>
          expect(err.message).to.include ".type() can only be called on a single textarea or :text! Your subject contained #{@num} elements!"
          done()

      it "throws when the subject isnt visible", (done) ->
        input = cy.$("input:text:first").show().hide()

        node = Cypress.Utils.stringifyElement(input)

        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(2)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.type() cannot be called on the non-visible element: #{node}"
          done()

        cy.get("input:text:first").type("foo")

      it "throws when submitting within nested forms"

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.type("foobar")

  context "#clear", ->
    it "does not change the subject", ->
      textarea = cy.$("textarea")

      cy.get("textarea").clear().then ($textarea) ->
        expect($textarea).to.match textarea

    it "removes the current value", ->
      textarea = cy.$("#comments")
      textarea.val("foo bar")

      ## make sure it really has that value first
      expect(textarea).to.have.value("foo bar")

      cy.get("#comments").clear().then ($textarea) ->
        expect($textarea).to.have.value("")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.on "fail", (err) -> done()

        cy.noop({}).clear()

      it "throws if any subject isnt a textarea", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(3)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <form id=\"checkboxes\"></form>"
          done()

        cy.get("textarea:first,form#checkboxes").clear()

      it "throws if any subject isnt a :text", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <div id=\"dom\"></div>"
          done()

        cy.get("div").clear()

      it "throws on an input radio", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"radio\" name=\"gender\" value=\"male\">"
          done()

        cy.get(":radio").clear()

      it "throws on an input checkbox", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"checkbox\" name=\"colors\" value=\"blue\">"
          done()

        cy.get(":checkbox").clear()

      it "throws when the subject isnt visible", (done) ->
        input = cy.$("input:text:first").show().hide()

        node = Cypress.Utils.stringifyElement(input)

        cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.clear() cannot be called on the non-visible element: #{node}"
          done()

        cy.get("input:text:first").clear()

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.clear()

    describe ".log", ->
      it "logs immediately before resolving", (done) ->
        input = cy.$("input:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "clear"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        cy.get("input:first").clear()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get("input:first").clear().then ($input) ->
          expect(@log.get("snapshot")).to.be.an("object")

  context "#check", ->
    it "does not change the subject", ->
      checkboxes = "[name=colors]"
      inputs = cy.$(checkboxes)
      cy.get(checkboxes).check().then ($inputs) ->
        expect($inputs).to.match(inputs)

    it "checks a checkbox", ->
      cy.get(":checkbox[name='colors'][value='blue']").check().then ($checkbox) ->
        expect($checkbox).to.be.checked

    it "checks a radio", ->
      cy.get(":radio[name='gender'][value='male']").check().then ($radio) ->
        expect($radio).to.be.checked

    it "is a noop if already checked", (done) ->
      checkbox = ":checkbox[name='colors'][value='blue']"
      cy.$(checkbox).prop("checked", true)
      cy.$(checkbox).change ->
        done("should not fire change event")
      cy.get(checkbox).check()
      cy.on "end", -> done()

    it "can check a collection", ->
      cy.get("[name=colors]").check().then ($inputs) ->
        $inputs.each (i, el) ->
          expect($(el)).to.be.checked

    it "can check a specific value from a collection", ->
      cy.get("[name=colors]").check("blue").then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 1
        expect($inputs.filter("[value=blue]")).to.be.checked

    it "can check multiple values from a collection", ->
      cy.get("[name=colors]").check(["blue", "green"]).then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 2
        expect($inputs.filter("[value=blue],[value=green]")).to.be.checked

    describe "events", ->
      it "emits click event", (done) ->
        cy.$("[name=colors][value=blue]").click -> done()
        cy.get("[name=colors]").check("blue")

      it "emits change event", (done) ->
        cy.$("[name=colors][value=blue]").change -> done()
        cy.get("[name=colors]").check("blue")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when subject isnt dom", (done) ->
        cy.noop({}).check()

        cy.on "fail", (err) -> done()

      it "throws when subject isnt a checkbox or radio", (done) ->
        ## this will find multiple forms
        cy.get("form").check()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".check() can only be called on :checkbox and :radio! Your subject contains a: <form id=\"by-id\"></form>"
          done()

      it "throws when any member of the subject isnt a checkbox or radio", (done) ->
        ## find a textare which should blow up
        ## the textarea is the last member of the subject
        cy.get(":checkbox,:radio,#comments").check()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".check() can only be called on :checkbox and :radio! Your subject contains a: <textarea id=\"comments\"></textarea>"
          done()

      it "throws when any member of the subject isnt visible", (done) ->
        chk = cy.$(":checkbox")
        chk.show().last().hide()

        node = Cypress.Utils.stringifyElement(chk.last())

        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(chk.length + 1)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.check() cannot be called on the non-visible element: #{node}"
          done()

        cy.get(":checkbox").check()

        it "logs once when not dom subject", (done) ->
          logs = []

          Cypress.on "log", (@log) =>
            logs.push @log

          cy.on "fail", (err) =>
            expect(logs).to.have.length(1)
            expect(@log.get("error")).to.eq(err)
            done()

          cy.check()

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        chk = cy.$(":checkbox:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "check"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        cy.get(":checkbox:first").check()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get(":checkbox:first").check().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs only 1 check event", ->
        logs = []
        checks = []

        Cypress.on "log", (log) ->
          logs.push(log)
          checks.push(log) if log.get("name") is "check"

        cy.get("[name=colors][value=blue]").check().then ->
          expect(logs).to.have.length(2)
          expect(checks).to.have.length(1)

      it "passes in $el", ->
        cy.get("[name=colors][value=blue]").check().then ($input) ->
          expect(@log.get("$el").get(0)).to.eq $input.get(0)

      it "#onConsole", ->
        cy.get("[name=colors][value=blue]").check().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el")
            Elements: 1
          }

      it "#onConsole when checkbox is already checked", ->
        cy.get("[name=colors][value=blue]").check().check().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "check"
            "Applied To": @log.get("$el")
            Elements: 1
            Note: "This checkbox was already checked. No operation took place."
          }

  context "#uncheck", ->
    it "unchecks a checkbox", ->
      cy.get("[name=birds][value=cockatoo]").uncheck().then ($checkbox) ->
        expect($checkbox).not.to.be.checked

    it "unchecks a checkbox by value", ->
      cy.get("[name=birds]").uncheck("cockatoo").then ($checkboxes) ->
        expect($checkboxes.filter(":checked").length).to.eq 1
        expect($checkboxes.filter("[value=cockatoo]")).not.to.be.checked

    it "unchecks multiple checkboxes by values", ->
      cy.get("[name=birds]").uncheck(["cockatoo", "amazon"]).then ($checkboxes) ->
        expect($checkboxes.filter(":checked").length).to.eq 0
        expect($checkboxes.filter("[value=cockatoo],[value=amazon]")).not.to.be.checked

    it "is a noop if already unchecked", (done) ->
      checkbox = "[name=birds][value=cockatoo]"
      cy.$(checkbox).prop("checked", false).change ->
        done("should not fire change event")
      cy.get(checkbox).uncheck()
      cy.on "end", -> done()

    describe "events", ->
      it "emits click event", (done) ->
        cy.$("[name=colors][value=blue]").prop("checked", true).click -> done()
        cy.get("[name=colors]").uncheck("blue")

      it "emits change event", (done) ->
        cy.$("[name=colors][value=blue]").prop("checked", true).change -> done()
        cy.get("[name=colors]").uncheck("blue")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws specifically on a radio", (done) ->
        cy.get(":radio").uncheck()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".uncheck() can only be called on :checkbox!"
          done()

      it "throws if not a checkbox", (done) ->
        cy.noop({}).uncheck()

        cy.on "fail", -> done()

      it "throws when any member of the subject isnt visible", (done) ->
        ## grab the first 3 checkboxes!
        chk = cy.$(":checkbox").slice(0, 3).show()

        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          node = Cypress.Utils.stringifyElement(chk.last())
          len  = (chk.length * 2) + 6
          expect(logs).to.have.length(len)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.uncheck() cannot be called on the non-visible element: #{node}"
          done()

        cy
          .get(":checkbox").invoke("slice", 0, 3).check().last().invoke("hide")
          .get(":checkbox").invoke("slice", 0, 3).uncheck()

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.uncheck()

    describe ".log", ->
      beforeEach ->
        cy.$("[name=colors][value=blue]").prop("checked", true)

        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        chk = cy.$(":checkbox:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "uncheck"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq chk.get(0)
            done()

        cy.get(":checkbox:first").check().uncheck()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get(":checkbox:first").check().uncheck().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs only 1 check event", ->
        logs = []
        unchecks = []

        Cypress.on "log", (log) ->
          logs.push(log)
          unchecks.push(log) if log.get("name") is "uncheck"

        cy.get("[name=colors][value=blue]").uncheck().then ->
          expect(logs).to.have.length(2)
          expect(unchecks).to.have.length(1)

      it "passes in $el", ->
        cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          expect(@log.get("$el").get(0)).to.eq $input.get(0)

      it "#onConsole", ->
        cy.get("[name=colors][value=blue]").uncheck().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "uncheck"
            "Applied To": @log.get("$el")
            Elements: 1
          }

      it "#onConsole when checkbox is already unchecked", ->
        cy.get("[name=colors][value=blue]").invoke("prop", "checked", false).uncheck().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "uncheck"
            "Applied To": @log.get("$el")
            Elements: 1
            Note: "This checkbox was already unchecked. No operation took place."
          }

  context "#submit", ->
    it "does not change the subject", ->
      form = cy.$("form")

      cy.get("form").submit().then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "is a child command", (done) ->
        cy.on "fail", -> done()

        cy.submit()

      it "throws when non dom subject", (done) ->
        cy.on "fail", -> done()

        cy.noop({}).submit()

      it "throws when subject isnt a form", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(2)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include ".submit() can only be called on a <form>! Your subject contains a: <input id=\"input\">"
          done()

        cy.get("input").submit()

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.submit()

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        form = cy.$("form:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "submit"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq form.get(0)
            done()

        cy.get("form:first").submit()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get("form:first").submit().then ($input) ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "provides $el", ->
        cy.get("form").first().submit().then ($form) ->
          expect(@log.get("name")).to.eq "submit"
          expect(@log.get("$el")).to.match $form

      it "#onConsole", ->
        cy.get("form").first().submit().then ($form) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "submit"
            "Applied To": @log.get("$el")
            Elements: 1
          }

  context "#focused", ->
    it "returns the activeElement", ->
      button = cy.$("#button")
      button.get(0).focus()

      cy.focused().then ($focused) ->
        expect($focused.get(0)).to.eq(button.get(0))

    it "returns null if no activeElement", ->
      button = cy.$("#button")
      button.get(0).focus()
      button.get(0).blur()

      cy.focused().then ($focused) ->
        expect($focused).to.be.null

    it "uses forceFocusedEl if set", ->
      input = cy.$("input:first")
      cy.prop("forceFocusedEl", input.get(0))

      cy.focused().then ($focused) ->
        expect($focused.get(0)).to.eq input.get(0)

    it "refuses to use blacklistFocusedEl", ->
      input = cy.$("input:first")
      cy.prop("blacklistFocusedEl", input.get(0))

      cy
        .get("input:first").focus()
        .focused().then ($focused) ->
          expect($focused).to.be.null

    describe ".log", ->
      beforeEach ->
        cy.$("input:first").get(0).focus()
        Cypress.on "log", (@log) =>

      it "ends immediately", ->
        cy.focused().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("success")

      it "snapshots immediately", ->
        cy.focused().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "passes in $el", ->
        cy.get("input:first").focused().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "#onConsole", ->
        cy.get("input:first").focused().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "focused"
            "Returned": $input
          }

  context "#focus", ->
    it "sends a focus event", (done) ->
      cy.$("#focus input").focus -> done()

      cy.get("#focus input").focus()

    it "bubbles focusin event", (done) ->
      cy.$("#focus").focusin -> done()

      cy.get("#focus input").focus()

    it "manually blurs focused subject as a fallback", (done) ->
      cy.$("input:first").blur -> done()

      cy
        .get("input:first").focus()
        .get("#focus input").focus()

    it "sets forceFocusedEl", ->
      input = cy.$("#focus input")

      cy
        .get("#focus input").focus()
        .focused().then ($focused) ->
          expect($focused.get(0)).to.eq(input.get(0))

          ## make sure we have either set the property
          ## or havent
          if document.hasFocus()
            expect(cy.prop("forceFocusedEl")).not.to.be.ok
          else
            expect(cy.prop("forceFocusedEl")).to.eq(input.get(0))

    it "matches cy.focused()", ->
      button = cy.$("#button")

      cy.get("#button").focus().focused().then ($focused) ->
        expect($focused.get(0)).to.eq button.get(0)

    it "returns the original subject", ->
      button = cy.$("#button")

      cy.get("#button").focus().then ($button) ->
        expect($button).to.match button

    it "causes first focused element to receive blur", (done) ->
      cy.$("input:first").blur ->
        console.log "first blurred"
        done()

      cy
        .get("input:first").focus()
        .get("input:last").focus()

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        input = cy.$(":text:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "focus"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        cy.get(":text:first").focus()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get(":text:first").focus().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "passes in $el", ->
        cy.get("input:first").focus().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs 2 focus event", ->
        logs = []

        Cypress.on "log", (log) ->
          logs.push(log)

        cy
          .get("input:first").focus()
          .get("button:first").focus().then ->
            names = _(logs).map (log) -> log.get("name")
            expect(logs).to.have.length(4)
            expect(names).to.deep.eq ["get", "focus", "get", "focus"]

      it "#onConsole", ->
        cy.get("input:first").focus().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "focus"
            "Applied To": $input
          }

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.noop({}).focus()

        cy.on "fail", -> done()

      it "throws when not a[href],link[href],button,input,select,textarea,[tabindex]", (done) ->
        cy.get("form").focus()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".focus() can only be called on a valid focusable element! Your subject is a: <form id=\"by-id\"></form>"
          done()

      it "throws when subject is a collection of elements", (done) ->
        cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .focus()

        cy.on "fail", (err) =>
          expect(err.message).to.include ".focus() can only be called on a single element! Your subject contained #{@num} elements!"
          done()

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.focus()

  context "#blur", ->
    it "should blur the originally focused element", (done) ->
      cy.$("#focus input").blur -> done()

      cy.get("#focus").within ->
        cy
          .get("input").focus()
          .get("button").focus()

    it "black lists the focused element", ->
      input = cy.$("#focus input")

      cy
        .get("#focus input").focus().blur()
        .focused().then ($focused) ->
          expect($focused).to.be.null

          ## make sure we have either set the property
          ## or havent
          if document.hasFocus()
            expect(cy.prop("blacklistFocusedEl")).not.to.be.ok
          else
            expect(cy.prop("blacklistFocusedEl")).to.eq(input.get(0))

    it "sends a focusout event", (done) ->
      cy.$("#focus").focusout -> done()

      cy.get("#focus input").focus().blur()

    it "sends a blur event", (done) ->
      # cy.$("input:text:first").get(0).addEventListener "blur", -> done()
      cy.$("input:first").blur -> done()

      cy.get("input:first").focus().blur()

    it "returns the original subject", ->
      input = cy.$("input:first")

      cy.get("input:first").focus().blur().then ($input) ->
        expect($input).to.match input

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        input = cy.$(":text:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "blur"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        cy.get(":text:first").focus().blur()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get(":text:first").focus().blur().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "passes in $el", ->
        cy.get("input:first").focus().blur().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs 1 blur event", ->
        logs = []

        Cypress.on "log", (log) ->
          logs.push(log)

        cy
          .get("input:first").focus().blur().then ->
            names = _(logs).map (log) -> log.get("name")
            expect(logs).to.have.length(3)
            expect(names).to.deep.eq ["get", "focus", "blur"]

      it "#onConsole", ->
        cy.get("input:first").focus().blur().then ($input) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "blur"
            "Applied To": $input
          }

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.noop({}).blur()

        cy.on "fail", -> done()

      it "throws when subject is a collection of elements", (done) ->
        cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .blur()

        cy.on "fail", (err) =>
          expect(err.message).to.include ".blur() can only be called on a single element! Your subject contained #{@num} elements!"
          done()

      it "throws when there isnt an activeElement", (done) ->
        cy.get("form:first").blur()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".blur() can only be called when there is a currently focused element."
          done()

      it "throws when blur is called on a non-active element", (done) ->
        cy
          .get("input:first").focus()
          .get("#button").blur()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".blur() can only be called on the focused element. Currently the focused element is a: <input id=\"input\">"
          done()

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.blur()

  context "#dblclick", ->
    it "sends a dblclick event", (done) ->
      cy.$("#button").dblclick (e) -> done()

      cy.get("#button").dblclick()

    it "returns the original subject", ->
      button = cy.$("#button")

      cy.get("#button").dblclick().then ($button) ->
        expect($button).to.match button

    it "causes focusable elements to receive focus", (done) ->
      text = cy.$(":text:first")

      text.focus -> done()

      cy.get(":text:first").dblclick()

    it "silences errors on onfocusable elements", ->
      div = cy.$("div:first")

      cy.get("div:first").dblclick()

    it "causes first focused element to receive blur", (done) ->
      cy.$("input:first").blur ->
        console.log "input:first blurred"
        done()

      cy
        .get("input:first").focus()
        .get("input:text:last").dblclick()

    it "inserts artificial delay of 10ms", ->
      cy.on "invoke:start", (obj) =>
        if obj.name is "dblclick"
          @delay = @sandbox.spy Promise.prototype, "delay"

      cy.get("#button").dblclick().then ->
        expect(@delay).to.be.calledWith 10

    it "inserts artificial delay of 50ms for anchors", ->
      cy.on "invoke:start", (obj) =>
        if obj.name is "dblclick"
          @delay = @sandbox.spy Promise.prototype, "delay"

      cy.contains("Home Page").dblclick().then ->
        expect(@delay).to.be.calledWith 50

    it "can operate on a jquery collection", ->
      dblclicks = 0
      buttons = cy.$("button")
      buttons.dblclick ->
        dblclicks += 1
        return false

      ## make sure we have more than 1 button
      expect(buttons.length).to.be.gt 1

      ## make sure each button received its dblclick event
      cy.get("button").dblclick().then ($buttons) ->
        expect($buttons.length).to.eq dblclicks

    it "can cancel multiple dblclicks", (done) ->
      dblclicks = 0

      spy = @sandbox.spy ->
        Cypress.abort()

      ## abort after the 3rd dblclick
      dblclicked = _.after 3, spy

      anchors = cy.$("#sequential-clicks a")
      anchors.dblclick ->
        dblclicks += 1
        dblclicked()

      ## make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte 5

      cy.on "cancel", ->
        _.delay ->
          ## abort should only have been called once
          expect(spy.callCount).to.eq 1

          ## and we should have stopped dblclicking after 3
          expect(dblclicks).to.eq 3
          done()
        , 200

      cy.get("#sequential-clicks a").dblclick()

    it "serially dblclicks a collection", ->
      dblclicks = 0

      ## create a throttled dblclick function
      ## which proves we are dblclicking serially
      throttled = _.throttle ->
        dblclicks += 1
      , 40, {leading: false}

      anchors = cy.$("#sequential-clicks a")
      anchors.dblclick throttled

      ## make sure we're dblclicking multiple anchors
      expect(anchors.length).to.be.gt 1
      cy.get("#sequential-clicks a").dblclick().then ($anchors) ->
        expect($anchors.length).to.eq dblclicks

    it "increases the timeout delta after each dblclick", (done) ->
      prevTimeout = @test.timeout()

      count = cy.$("button").length

      cy.on "invoke:end", (obj) =>
        if obj.name is "dblclick"
          expect(@test.timeout()).to.eq (count * 10) + prevTimeout
          done()

      cy.get("button").dblclick()

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.on "fail", -> done()

        cy.dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = cy.$("button").show().last().hide()

        node = Cypress.Utils.stringifyElement(btn)

        cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.dblclick() cannot be called on the non-visible element: #{node}"
          done()

        cy.get("button").dblclick()

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.dblclick()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = cy.$("#three-buttons button").show().last().hide()

        node = Cypress.Utils.stringifyElement(btn)

        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(4)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.dblclick() cannot be called on the non-visible element: #{node}"
          done()

        cy.get("#three-buttons button").dblclick()

    describe ".log", ->
      it "logs immediately before resolving", (done) ->
        button = cy.$("button:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "dblclick"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        cy.get("button:first").dblclick()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get("button:first").dblclick().then ($button) ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "returns only the $el for the element of the subject that was dblclicked", ->
        dblclicks = []

        ## append two buttons
        button = -> $("<button class='dblclicks'>dblclick</button")
        cy.$("body").append(button()).append(button())

        Cypress.on "log", (obj) ->
          dblclicks.push(obj) if obj.get("name") is "dblclick"

        cy.get("button.dblclicks").dblclick().then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(dblclicks.length).to.eq(2)
          expect(dblclicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 dblclick event", ->
        logs = []

        Cypress.on "log", (log) ->
          logs.push(log) if log.get("name") is "dblclick"

        cy.get("button:first").dblclick().then ->
          expect(logs).to.have.length(1)

      it "#onConsole", ->
        Cypress.on "log", (@log) =>

        cy.get("button").first().dblclick().then ($button) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "dblclick"
            "Applied To": @log.get("$el")
            Elements: 1
          }

  context "#click", ->
    it "sends a click event", (done) ->
      cy.$("#button").click -> done()

      cy.get("#button").click()

    it "returns the original subject", ->
      button = cy.$("#button")

      cy.get("#button").click().then ($button) ->
        expect($button).to.match button

    it "causes focusable elements to receive focus", (done) ->
      text = cy.$(":text:first")

      text.focus -> done()

      cy.get(":text:first").click()

    it "silences errors on onfocusable elements", ->
      div = cy.$("div:first")

      cy.get("div:first").click()

    it "causes first focused element to receive blur", (done) ->
      cy.$("input:first").blur ->
        console.log "input:first blurred"
        done()

      cy
        .get("input:first").focus()
        .get("input:text:last").click()

    it "inserts artificial delay of 10ms", ->
      cy.on "invoke:start", (obj) =>
        if obj.name is "click"
          @delay = @sandbox.spy Promise.prototype, "delay"

      cy.get("#button").click().then ->
        expect(@delay).to.be.calledWith 10

    it "inserts artificial delay of 50ms for anchors", ->
      cy.on "invoke:start", (obj) =>
        if obj.name is "click"
          @delay = @sandbox.spy Promise.prototype, "delay"

      cy.contains("Home Page").click().then ->
        expect(@delay).to.be.calledWith 50

    it "can operate on a jquery collection", ->
      clicks = 0
      buttons = cy.$("button")
      buttons.click ->
        clicks += 1
        return false

      ## make sure we have more than 1 button
      expect(buttons.length).to.be.gt 1

      ## make sure each button received its click event
      cy.get("button").click().then ($buttons) ->
        expect($buttons.length).to.eq clicks

    it "can cancel multiple clicks", (done) ->
      clicks = 0

      spy = @sandbox.spy ->
        Cypress.abort()

      ## abort after the 3rd click
      clicked = _.after 3, spy

      anchors = cy.$("#sequential-clicks a")
      anchors.click ->
        clicks += 1
        clicked()

      ## make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte 5

      cy.on "cancel", ->
        _.delay ->
          ## abort should only have been called once
          expect(spy.callCount).to.eq 1

          ## and we should have stopped clicking after 3
          expect(clicks).to.eq 3
          done()
        , 200

      cy.get("#sequential-clicks a").click()

    it "serially clicks a collection", ->
      clicks = 0

      ## create a throttled click function
      ## which proves we are clicking serially
      throttled = _.throttle ->
        clicks += 1
      , 40, {leading: false}

      anchors = cy.$("#sequential-clicks a")
      anchors.click throttled

      ## make sure we're clicking multiple anchors
      expect(anchors.length).to.be.gt 1
      cy.get("#sequential-clicks a").click().then ($anchors) ->
        expect($anchors.length).to.eq clicks

    it "increases the timeout delta after each click", (done) ->
      prevTimeout = @test.timeout()

      count = cy.$("#three-buttons button").length

      cy.on "invoke:end", (obj) =>
        if obj.name is "click"
          expect(@test.timeout()).to.eq (count * 10) + prevTimeout
          done()

      cy.get("#three-buttons button").click()

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.on "fail", -> done()

        cy.click()

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.click()

      it "throws when any member of the subject isnt visible", (done) ->
        btn = cy.$("#three-buttons button").show().last().hide()

        node = Cypress.Utils.stringifyElement(btn)

        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(4)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.eq "cy.click() cannot be called on the non-visible element: #{node}"
          done()

        cy.get("#three-buttons button").click()

    describe ".log", ->
      it "logs immediately before resolving", (done) ->
        button = cy.$("button:first")

        Cypress.on "log", (log) ->
          if log.get("name") is "click"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq button.get(0)
            done()

        cy.get("button:first").click()

      it "snapshots after clicking", ->
        Cypress.on "log", (@log) =>

        cy.get("button:first").click().then ($button) ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "returns only the $el for the element of the subject that was clicked", ->
        clicks = []

        ## append two buttons
        button = -> $("<button class='clicks'>click</button")
        cy.$("body").append(button()).append(button())

        Cypress.on "log", (obj) ->
          clicks.push(obj) if obj.get("name") is "click"

        cy.get("button.clicks").click().then ($buttons) ->
          expect($buttons.length).to.eq(2)
          expect(clicks.length).to.eq(2)
          expect(clicks[1].get("$el").get(0)).to.eq $buttons.last().get(0)

      it "logs only 1 click event", ->
        logs = []

        Cypress.on "log", (log) ->
          logs.push(log) if log.get("name") is "click"

        cy.get("button:first").click().then ->
          expect(logs).to.have.length(1)

      it "#onConsole", ->
        Cypress.on "log", (@log) =>

        cy.get("button").first().click().then ($button) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "click"
            "Applied To": @log.get("$el")
            Elements: 1
          }

  context "#invoke2", ->
    it "waits for isReady before invoking command", (done) ->
      ## when we are isReady false that means we should
      ## never begin invoking our commands
      cy.isReady(false)
      cy.noop()
      cy.on "invoke:start", -> done("should not trigger this")
      cy.on "set", ->
        ## we wait until we hear set because that means
        ## we've begun running our promise
        Cypress.abort().then -> done()

    it "updates the stored href", ->
      cy
        .then ->
          expect(cy.prop("href")).to.include "/fixtures/html/dom.html"
        .visit("/foo").then ->
          expect(cy.prop("href")).to.eq "foo/"

  context "#isReady", ->
    it "creates a deferred when not ready", ->
      cy.isReady(false)
      keys = _.keys cy.prop("ready")
      expect(keys).to.include("promise", "resolve", "reject")

    it "resolves the deferred when ready", (done) ->
      cy.isReady(false)
      cy.isReady(true)
      cy.once "ready", (bool) ->
        expect(cy.prop("ready").promise.isResolved()).to.be.true
        done()
      null

    it "prevents a bug creating an additional .then promise", (done) ->
      cy.isReady(false)
      cy.isReady(true)

      cy.on "end", ->
        expect(cy.queue.length).to.eq(1)
        done()

      cy.noop({})

  context "proxyies", ->
    fns = [
      {each: -> $(@).removeClass().addClass("foo")}
      {map: -> $(@).text()}
    ]
    _.each fns, (fn) ->
      ## normalize string vs object
      if _.isObject(fn)
        name = _.keys(fn)[0]
        arg = fn[name]
      else
        name = fn

      context "##{name}", ->
        it "proxies through to jquery and returns new subject", ->
          el = cy.$("#list")[name](arg)
          cy.get("#list")[name](arg).then ($el) ->
            expect($el).to.match el

        it "errors without a dom element", (done) ->
          @sandbox.stub cy.runner, "uncaught"

          cy.noop({})[name](arg)

          cy.on "fail", -> done()

        describe ".log", ->
          beforeEach ->
            Cypress.on "log", (@log) =>

          it "ends immediately", ->
            cy.get("#list")[name](arg).then ->
              expect(@log.get("end")).to.be.true
              expect(@log.get("state")).to.eq("success")

          it "snapshots immediately", ->
            cy.get("#list")[name](arg).then ->
              expect(@log.get("snapshot")).to.be.an("object")

          it "#onConsole", ->
            cy.get("#list")[name](arg).then ($el) ->
              obj = {Command: name}
              obj.Selector = [].concat(arg).join(", ") unless _.isFunction(arg)

              _.extend obj, {
                "Applied To": getFirstSubjectByName("get")
                Returned: $el
                Elements: $el.length
              }

              expect(@log.attributes.onConsole()).to.deep.eq obj

  context "traversals", ->
    fns = [
      {find: "*"}
      {filter: ":first"}
      {eq: 0}
      {closest: "body"}
      "children", "first", "last", "next", "parent", "parents", "prev", "siblings"
    ]
    _.each fns, (fn) ->
      ## normalize string vs object
      if _.isObject(fn)
        name = _.keys(fn)[0]
        arg = fn[name]
      else
        name = fn

      context "##{name}", ->
        it "proxies through to jquery and returns new subject", ->
          el = cy.$("#list")[name](arg)
          cy.get("#list")[name](arg).then ($el) ->
            expect($el).to.match el

        it "errors without a dom element", (done) ->
          @sandbox.stub cy.runner, "uncaught"

          cy.noop({})[name](arg)

          cy.on "fail", -> done()

        describe ".log", ->
          beforeEach ->
            Cypress.on "log", (@log) =>

          it "logs immediately before resolving", (done) ->
            Cypress.on "log", (log) ->
              if log.get("name") is name
                expect(log.pick("state")).to.deep.eq {
                  state: "pending"
                }
                done()

            cy.get("#list")[name](arg)

          it "snapshots after finding element", ->
            Cypress.on "log", (@log) =>

            cy.get("#list")[name](arg).then ->
              expect(@log.get("snapshot")).to.be.an("object")

          it "#onConsole", ->
            cy.get("#list")[name](arg).then ($el) ->
              obj = {Command: name}
              obj.Selector = [].concat(arg).join(", ") unless _.isFunction(arg)

              _.extend obj, {
                "Applied To": getFirstSubjectByName("get")
                Returned: $el
                Elements: $el.length
              }

              expect(@log.attributes.onConsole()).to.deep.eq obj

    it "retries until it finds", ->
      li = cy.$("#list li:last")
      span = $("<span>foo</span>")

      retry = _.after 3, ->
        li.append(span)

      cy.on "retry", retry

      cy.get("#list li:last").find("span").then ($span) ->
        expect($span.get(0)).to.eq(span.get(0))

    it "errors after timing out not finding element", (done) ->
      @sandbox.stub cy.runner, "uncaught"

      cy._timeout(300)

      cy.on "fail", (err) ->
        expect(err.message).to.include "Could not find element: span"
        done()

      cy.get("#list li:last").find("span")

  context "#then", ->
    it "mocha inserts 2 arguments to then: anonymous fn for invoking done(), and done reference itself", ->
      ## this puts tests in place to where if mocha
      ## ever updates and changes how it calls .then
      ## on the returned object, we will know

      cy.then ->
        expect(cy.queue.length).to.eq 2

        lastThen = _(cy.queue).last()

        expect(lastThen.args[0]).to.be.a.function
        expect(lastThen.args[1].length).to.eq 1

        ## if our browser supports the .name property
        ## of a function, then test it too to make
        ## sure its called 'done'
        if name = lastThen.args[1].name
          expect(name).to.eq "done"

    it "assigns prop next if .then matched what would be added by mocha", (done) ->
      fn = (err) ->

      cy.on "end", ->
        expect(cy.prop("next")).not.to.be.undefined
        done()

      cy.noop().then((->), fn)

    describe "yields to remote jQuery subject", ->
      beforeEach ->
        ## set the jquery path back to our
        ## remote window
        Cypress.option "jQuery", @iframe.prop("contentWindow").$

        cy.window().assign("remoteWindow")

      afterEach ->
        ## restore back to the global $
        Cypress.option "jQuery", $

      it "calls the callback function with the remote jQuery subject", ->
        @remoteWindow.$.fn.foo = fn = ->

        cy
          .get("input:first").then ($input) ->
            expectOriginal($input).to.be.instanceof @remoteWindow.$
            expectOriginal($input).to.have.property "foo", fn

      it "continues to pass the remote jQuery object downstream", ->
        cy
          .get("input:first").then ($input) ->
            expectOriginal($input).to.be.instanceof @remoteWindow.$
            return $input
          .then ($input) ->
            expectOriginal($input).to.be.instanceof @remoteWindow.$

      it "does not store the remote jquery object as the subject", ->
        cy
          .get("input:first").then ($input) ->
            expectOriginal($input).to.be.instanceof @remoteWindow.$
            return $input
          .then ($input) ->
            expectOriginal(cy.prop("subject")).not.to.be.instanceof @remoteWindow.$
            expectOriginal(cy.prop("subject")).to.be.instanceof window.$

      it "does not nuke selector properties", ->
        cy
          .get("input:first").then ($input) ->
            expectOriginal($input.selector).to.eq "input:first"
            return $input
          .then ($input) ->
            expectOriginal($input.selector).to.eq "input:first"

  context "#invoke", ->
    beforeEach ->
      ## set the jquery path back to our
      ## remote window
      Cypress.option "jQuery", @iframe.prop("contentWindow").$

      cy.window().assign("remoteWindow")

    afterEach ->
      ## restore back to the global $
      Cypress.option "jQuery", $

    describe "remote DOM subjects", ->
      it "is invoked on the remote DOM subject", ->
        @remoteWindow.$.fn.foo = -> "foo"

        cy.get("input:first").invoke("foo").then (str) ->
          expect(str).to.eq "foo"

      it "re-wraps the remote element if its returned", ->
        parent = cy.$("input:first").parent()
        expect(parent).to.exist

        cy.get("input:first").invoke("parent").then ($parent) ->
          expectOriginal($parent).to.be.instanceof @remoteWindow.$
          expect(cy.prop("subject")).to.match parent

    describe "function property", ->
      beforeEach ->
        @obj = {
          foo: -> "foo"
          bar: (num1, num2) -> num1 + num2
          err: -> throw new Error("fn.err failed!")
          baz: 10
        }

      it "changes subject to function invocation", ->
        cy.noop(@obj).invoke("foo").then (str) ->
          expect(str).to.eq "foo"

      it "forwards any additional arguments", ->
        cy.noop(@obj).invoke("bar", 1, 2).then (num) ->
          expect(num).to.eq 3

      it "changes subject to undefined", ->
        obj = {
          bar: -> undefined
        }

        cy.noop(obj).invoke("bar").then (val) ->
          expect(val).to.be.undefined

      describe "errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it "bubbles up automatically", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq "fn.err failed!"
            done()

          cy.noop(@obj).invoke("err")

    describe "regular property", ->
      beforeEach ->
        @obj = {
          baz: 10
        }

      it "returns undefined", ->
        cy.noop({foo: undefined}).invoke("foo").then (val) ->
          expect(val).to.be.undefined

      it "returns property", ->
        cy.noop(@obj).invoke("baz").then (num) ->
          expect(num).to.eq @obj.baz

      it "returns property on remote subject", ->
        @remoteWindow.$.fn.baz = 123

        cy.get("div:first").invoke("baz").then (num) ->
          expect(num).to.eq 123

      it "handles string subjects", ->
        str = "foobarbaz"

        cy.noop(str).invoke("length").then (num) ->
          expect(num).to.eq str.length

      it "handles properties on the prototype", ->
        num = new Number(10)

        cy.noop(num).invoke("valueOf").then (num) ->
          expect(num).to.eq 10

    describe ".log", ->
      beforeEach ->
        @obj = {
          foo: "foo bar baz"
          num: 123
          bar: -> "bar"
          sum: (args...) ->
            _.reduce args, (memo, num) ->
              memo + num
            , 0
        }

        Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        Cypress.on "log", (log) ->
          if log.get("name") is "invoke"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq "foo"
            done()

        cy.noop({foo: "foo"}).invoke("foo")

      it "snapshots after clicking", ->
        cy.noop({foo: "foo"}).invoke("foo").then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs obj as a property", ->
        cy.noop(@obj).invoke("foo").then ->
          obj = {
            name: "invoke"
            message: ".foo"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "logs obj as a function", ->
        cy.noop(@obj).invoke("bar").then ->
          obj = {
            name: "invoke"
            message: ".bar()"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#onConsole as a regular property", ->
        cy.noop(@obj).invoke("num").then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command:  "invoke"
            Property: ".num"
            On:       @obj
            Returned: 123
          }

      it "#onConsole as a function property without args", ->
        cy.noop(@obj).invoke("bar").then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command:  "invoke"
            Function: ".bar()"
            On:       @obj
            Returned: "bar"
          }

      it "#onConsole as a function property with args", ->
        cy.noop(@obj).invoke("sum", 1, 2, 3).then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command:  "invoke"
            Function: ".sum()"
            "With Arguments": [1,2,3]
            On:       @obj
            Returned: 6
          }

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when property does not exist on the subject", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.invoke() errored because the property: 'foo' does not exist on your subject."
          expect(@log.get("error")).to.eq err
          done()

        cy.noop({}).invoke("foo")

      it "throws without a subject (even as a dual command)", (done) ->
        cy.on "invoke:start", (obj) =>
          obj.prev = null

        cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.invoke() is a child command which operates on an existing subject.  Child commands must be called after a parent command!"
          done()

        cy.invoke("queue")

      it "throws when first argument isnt a string", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          expect(err.message).to.eq "cy.invoke() only accepts a string as the first argument."
          expect(@log.get("error")).to.eq err
          done()

        cy.noop({}).invoke({})

      it "logs once when not dom subject", (done) ->
        logs = []

        Cypress.on "log", (@log) =>
          logs.push @log

        cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        cy.invoke({})

      it "ensures subject", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "Subject is undefined!  You cannot call .its() without a subject."
          done()

        cy.noop(undefined).its("attr", "src")

  context "#its", ->
    it "proxies to #invoke", ->
      cy.noop({foo: -> "bar"}).its("foo").should("eq", "bar")

  context "#run", ->
    it "calls prop next() on end if exists", (done) ->
      fn = -> done()

      cy.prop("next", fn)

      cy.noop()

    it "removes prop next after calling", (done) ->
      fn = -> _.defer ->
        expect(cy.prop("next")).to.eq null
        done()

      cy.prop("next", fn)

      cy.noop()

  context "#_storeHref", ->
    it "sets prop href", ->
      cy._storeHref()
      expect(cy.prop("href")).to.include "/fixtures/html/dom.html"

    it "strips the hash from the href", ->
      @sandbox.stub(cy.sync, "location").returns
        href: "/foo/bar#baz/quux"
        hash: "#baz/quux"

      cy._storeHref()
      expect(cy.prop("href")).to.eq "/foo/bar"

  context "cancelling promises", ->
    it "cancels via a delay", (done) ->
      pending = Promise.pending()

      promise = Promise.delay(0).cancellable().then ->
        done("not cancelled")
      .caught Promise.CancellationError, (err) ->
        done()

      promise.cancel()

  context ".inject", ->
    it "prepends child callback with subject argument", (done) ->
      body = cy.$("body")

      Cypress.addChildCommand "foo", (subject) ->
        expect(subject).to.match body
        done()

      cy.get("body").foo()

    describe "nuking subject when chainerId doesnt match", ->
      it "parent commands", ->
        Cypress.addParentCommand "foo", ->
          expect(cy.prop("subject")).not.to.be.ok
          return {foo: "bar"}

        cy.foo()
        cy.foo()

      it "dual commands", (done) ->
        Cypress.addDualCommand "foo", (subject) ->
          expect(subject).to.be.null
          done()

        cy.get("body")
        cy.foo()

      it "child commands", (done) ->
        @sandbox.stub cy.runner, "uncaught"

        Cypress.addChildCommand "foo", (subject) ->

        cy.on "fail", (err) ->
          expect(err.message).to.eq "Subject is null!  You cannot call .find() without a subject."
          done()

        cy.get("body")
        cy.find("div")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws without a subject", (done) ->
        Cypress.addChildCommand "foo", ->

        cy.on "fail", (err) ->
          expect(err.message).to.include "cy.foo() is a child command which operates on an existing subject.  Child commands must be called after a parent command!"
          done()

        cy.foo()

  context ".abort", ->
    it "fires cancel event when theres an outstanding command", (done) ->
      cy.wait(1000)
      cy.on "cancel", -> done()
      cy.on "set", (obj) ->
        Cypress.abort() if obj.name is "wait"

    it "doesnt fire cancel event when no commands left", (done) ->
      cy.noop()
      cy.on "cancel", -> done("should not cancel")
      cy.on "end", ->
        Cypress.abort().then -> done()

    it "aborts running commands in the middle of running", (done) ->
      cy.on "cancel", (obj) ->
        expect(obj.name).to.eq "then"
        done()

      cy.wait(10).then ->
        ## simulate the abort action happening
        ## during this .then command
        Cypress.abort()

        ## imagine we are returning another promise
        ## in our then command
        Promise.delay(10).then ->

          done("should not reach here")

  context "promises", ->
    it "doesnt invoke .then on the cypress instance", (done) ->
      _then = @sandbox.spy cy, "then"
      cy.wait(1000)

      cy.on "set", (obj) ->
        if obj.name is "wait"
          Cypress.abort().then ->
            expect(_then).not.to.be.called
            done()

  context ".restore", ->
    it "removes bound events", ->
      cy.on "foo", ->
      cy.on "bar", ->
      Cypress.restore()
      expect(cy._events).to.be.undefined

  context "#prop", ->
    beforeEach ->
      Cypress.restore()

    it "is initially empty", ->
      expect(cy.props).to.deep.eq {}

    it "inserts into the props registry", ->
      cy.prop("foo", "bar")
      expect(cy.props).to.deep.eq {foo: "bar"}

    it "calls defaults during restory", ->
      defaults = @sandbox.spy(cy, "defaults")
      Cypress.restore()
      expect(defaults).to.have.been.called

    it "acts as a getter when no value is given", ->
      cy.prop("foo", "bar")
      expect(cy.prop("foo")).to.eq "bar"

    describe "falsy setter values", ->
      before ->
        @set = (key, val) ->
          cy.prop(key, val)
          expect(cy.prop(key)).to.eq val
          expect(_.keys(cy.props)).to.have.length(1)

      it "sets zero", ->
        @set "zero", 0

      it "sets null", ->
        @set "null", null

      it "sets empty string", ->
        @set "string", ""

      it "sets undefined", ->
        @set "undefined", undefined

    describe "sets each prop in the registry to null", ->
      beforeEach ->
        cy.prop("foo", "bar")
        cy.prop("baz", "quux")
        cy.defaults()

        ## need to return null here else mocha would insert a .then
        ## into the cypress instance
        return null

      it "resets the registry", ->
        expect(cy.props).to.deep.eq {}

      it "deletes registered properies", ->

        expect([cy.prop("foo"), cy.prop("baz")]).to.deep.eq [undefined, undefined]

  context "#_timeout", ->
    it "setter", ->
      cy._timeout(500)
      expect(@test.timeout()).to.eq 500

    it "setter returns cy instance", ->
      ret = cy._timeout(500)
      expect(ret).to.eq cy

    it "setter can increase by delta", ->
      currentTimeout = @test.timeout()
      cy._timeout(500, true)
      expect(@test.timeout()).to.eq 500 + currentTimeout

    it "getter returns integer", ->
      timeout = @test.timeout()
      expect(cy._timeout()).to.eq timeout

    it "throws error when no runnable", ->
      Cypress.restore()
      fn = ->
        cy._timeout(500)

      expect(fn).to.throw(Error)

  context "#_contains", ->
    it "returns true if the document contains the element", ->
      btn = cy.$("#button").get(0)

      expect(cy._contains(btn)).to.be.true

    it "returns false if the document does not contain the element", ->
      btn = cy.$("#button").remove().get(0)

      expect(cy._contains(btn)).to.be.false

    it "returns true if all elements in the collection are in the document", ->
      inputs = cy.$("input")

      expect(cy._contains(inputs)).to.be.true

    it "returns false if any elemen isnt in the document", ->
      inputs = cy.$("input")
      inputs.last().remove()

      expect(cy._contains(inputs)).to.be.false

  context "#until", ->
    describe "it retries the previous command", ->
      it "retries when false", (done) ->
        i = 0
        fn = ->
          i += 1
        fn = @sandbox.spy fn
        cy.noop({}).then(fn).until (i) ->
          i is 3
        cy.on "end", ->
          expect(fn.callCount).to.eq 3
          done()

      it "retries when null", (done) ->
        i = 0
        fn = ->
          i += 1
        fn = @sandbox.spy fn
        cy.noop({}).then(fn).until (i) ->
          if i isnt 2 then null else true
        cy.on "end", ->
          expect(fn.callCount).to.eq 2
          done()

      ## until no longer retries when undefined
      # it "retries when undefined", (done) ->
      #   i = 0
      #   fn = ->
      #     i += 1
      #   fn = @sandbox.spy fn
      #   cy.noop({}).then(fn).until (i) ->
      #     if i isnt 2 then undefined else true
      #   cy.on "end", ->
      #     expect(fn.callCount).to.eq 2
      #     done()

    describe "errors thrown", ->
      beforeEach ->
        @uncaught = @sandbox.stub(cy.runner, "uncaught")

      it "times out eventually due to false value", (done) ->
        ## forcibly reduce the timeout to 100 ms
        ## so we dont have to wait so long
        cy
          .noop()
          .until (-> false), timeout: 100

        cy.on "fail", (err) ->
          expect(err.message).to.include "The final value was: false"
          done()

      it "appends to the err message", (done) ->
        cy
          .noop()
          .until (-> expect(true).to.be.false), timeout: 100

        cy.on "fail", (err) ->
          expect(err.message).to.include "Timed out retrying. Could not continue due to: AssertionError"
          done()

  context "#wait", ->
    describe "number argument", ->
      it "passes delay onto Promise", ->
        delay = @sandbox.spy Promise, "delay"
        cy.wait(50)
        cy.on "invoke:end", (obj) ->
          if obj.name is "wait"
            expect(delay).to.be.calledWith 50

      it "does not change the subject", ->
        cy
          .get("input")
          .then ($input) ->
            @$input = $input
          .wait(10).then ($input) ->
            expect($input).to.eq @$input

      it "does not time out the runnable", ->
        timer = @sandbox.useFakeTimers("setTimeout")
        trigger = @sandbox.spy(cy, "trigger")
        cy._timeout(1000)
        cy.wait()
        timer.tick()
        timer.tick(5000)
        expect(trigger).not.to.be.calledWith "invoke:end"

    describe "function argument", ->
      it "resolves when truthy", ->
        cy.wait ->
          "foo" is "foo"

      it "retries when false", (done) ->
        i = 0
        fn = ->
          i += 1
          i is 2
        fn = @sandbox.spy fn
        cy.wait(fn)
        cy.on "end", ->
          expect(fn.callCount).to.eq 2
          done()

      it "retries when null", (done) ->
        i = 0
        fn = ->
          i += 1
          if i isnt 2 then null else true
        fn = @sandbox.spy fn
        cy.then(fn).wait(fn)
        cy.on "end", ->
          expect(fn.callCount).to.eq 2
          done()

      it "resolves when undefined", (done) ->
        ## after returns undefined
        fn = -> undefined

        fn = @sandbox.spy fn
        cy.wait(fn)

        cy.on "end", ->
          expect(fn.callCount).to.eq 1
          done()

      it "resolves with existing subject", ->
        cy
          .get("input").then ($input) ->
            @$input = $input
          .wait(-> true)

        cy.on "invoke:end", (obj) =>
          if obj.name is "wait"
            expect(cy.prop("subject")).to.eq @$input

      describe "errors thrown", ->
        beforeEach ->
          @uncaught = @sandbox.stub(cy.runner, "uncaught")

        it "times out eventually due to false value", (done) ->
          ## forcibly reduce the timeout to 500 ms
          ## so we dont have to wait so long
          cy.wait (-> false), timeout: 100

          cy.on "fail", (err) ->
            expect(err.message).to.include "The final value was: false"
            done()

        it "appends to the err message", (done) ->
          cy.wait (-> expect(true).to.be.false), timeout: 100

          cy.on "fail", (err) ->
            expect(err.message).to.include "Timed out retrying. Could not continue due to: AssertionError"
            done()

    describe "alias argument", ->
      it "waits for a route alias to have a response", ->
        response = {foo: "foo"}

        cy
          .server()
          .route("GET", /.*/, response).as("fetch")
          .window().then (win) ->
            win.$.get("/foo")
          .wait("@fetch").then (xhr) ->
            obj = JSON.parse(xhr.responseText)
            expect(obj).to.deep.eq response

      it "resets the timeout after waiting", ->
        prevTimeout = cy._timeout()

        retry = _.after 3, _.once ->
          cy.sync.window().$.get("/foo")

        cy.on "retry", retry

        cy
          .server()
          .route("GET", /.*/, {}).as("fetch")
          .wait("@fetch").then ->
            expect(cy._timeout()).to.eq prevTimeout

      describe "errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it "throws when alias doesnt match a route", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() can only accept aliases for routes.  The alias: 'b' did not match a route."
            done()

          cy.get("body").as("b").wait("@b")

        it "throws when route is never resolved", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() timed out waiting for a response to the route: 'fetch'. No response ever occured."
            done()

          cy
            .server()
            .route("GET", /.*/, {}).as("fetch")
            .then ->
              ## reduce the timeout to speed up tests!
              cy._timeout(100)
            .wait("@fetch")

        it "throws when alias is missing '@' but matches an available alias", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq "Invalid alias: 'getAny'. You forgot the '@'. It should be written as: '@getAny'."
            done()

          cy
            .server()
            .route("*", {}).as("getAny")
            .wait("getAny").then ->

    describe ".log", ->
      beforeEach ->
        Cypress.on "log", (@log) =>

      it "immediately ends", ->
        cy.noop({}).wait(10).then ->
          expect(@log.get("state")).to.eq "success"

      it "immediately snapshots", ->
        it "immediately ends command", ->
          cy.noop({}).wait(10).then ->
            expect(@log.get("snapshot")).to.be.an("object")

      it "is a type: child if subject", ->
        cy.noop({}).wait(10).then ->
          expect(@log.get("type")).to.eq "child"

      it "is a type: child if subject is false", ->
        cy.noop(false).wait(10).then ->
          expect(@log.get("type")).to.eq "child"

      it "is a type: parent if subject is null or undefined", ->
        cy.wait(10).then ->
          expect(@log.get("type")).to.eq "parent"

      describe "number argument", ->
        it "#onConsole", ->
          cy.wait(10).then ->
            expect(@log.attributes.onConsole()).to.deep.eq {
              Command: "wait"
              "Waited For": "10ms before continuing"
            }

      describe "alias argument errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it ".log", (done) ->
          numRetries = 0

          cy.on "fail", (err) =>
            obj = {
              name: "wait"
              referencesAlias: "getFoo"
              aliasType: "route"
              type: "child"
              error: err
              event: "command"
              message: "@getFoo"
              numRetries: numRetries + 1
            }

            _.each obj, (value, key) =>
              expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

            done()

          cy.on "command:start", ->
            @_timeout(150)

          cy.on "retry", ->
            numRetries += 1

          cy
            .server()
            .route(/foo/, {}).as("getFoo")
            .noop({}).wait("@getFoo")

        it "#onConsole"

      describe "function argument errors", ->
        it ".log"

        it "#onConsole"

      ## at this moment we've removed wait for logging out
      ## when its an alias or a function argument
      # describe "alias argument", ->
      #   it "#onConsole", ->
      #     cy
      #       .server()
      #       .route(/foo/, {}).as("getFoo")
      #       .window().then (win) ->
      #         win.$.get("foo")
      #       .wait("@getFoo").then (xhr) ->
      #         expect(@log.attributes.onConsole()).to.deep.eq {
      #           Command: "wait"
      #           "Waited For": "alias: 'getFoo' to have a response"
      #           Alias: xhr
      #         }

      # describe "function argument", ->
      #   it "#onConsole", ->
      #     retriedThreeTimes = false

      #     retry = _.after 3, ->
      #       retriedThreeTimes = true

      #     cy.on "retry", retry

      #     fn = ->
      #       expect(retriedThreeTimes).to.be.true;

      #     cy
      #       .wait(fn).then ->
      #         expect(@log.attributes.onConsole()).to.deep.eq {
      #           Command: "wait"
      #           "Waited For": _.str.clean(fn.toString())
      #           Retried: "3 times"
      #         }

  context "#_retry", ->
    it "returns a nested cancellable promise", (done) ->
      i = 0
      fn = ->
        i += 1
        console.log "iteration #", i

      fn = @sandbox.spy fn

      cy.noop({}).then(fn).until -> i is 3

      cy.on "retry", ->
        ## abort after the 1st retry
        ## which is the 2nd invocation of i
        ## which should prevent the 3rd invocation
        Cypress.abort() if i is 2

      cy.on "cancel", ->
        ## once from .then and once from .until
        expect(fn.callCount).to.eq 2
        done()

    it "stores the runnables current timeout", ->
      prevTimeout = @test.timeout()
      options = {}
      fn = ->
      cy._retry(fn, options)
      expect(options.runnableTimeout).to.eq prevTimeout

    it "increases the runnables timeout exponentially", ->
      prevTimeout = @test.timeout()
      timeout = @sandbox.spy @test, "timeout"
      fn = ->
      cy._retry(fn, {})
      expect(timeout).to.be.calledWith 1e9

      expect(@test.timeout()).to.be.gt prevTimeout

  context ".log", ->
    describe "defaults", ->
      beforeEach ->
        obj = {name: "foo", ctx: cy, fn: (->), args: [1,2,3], type: "parent"}
        cy.prop("current", obj)

      it "sets name to current.name", (done) ->
        Cypress.on "log", (obj) ->
          expect(obj.get("name")).to.eq "foo"
          done()

        Cypress.command({})

      it "sets type to current.type", (done) ->
        Cypress.on "log", (obj) ->
          expect(obj.get("type")).to.eq "parent"
          done()

        Cypress.command({})

      it "sets message to stringified args", (done) ->
        Cypress.on "log", (obj) ->
          expect(obj.get("message")).to.deep.eq "1, 2, 3"
          done()

        Cypress.command({})

      it "omits ctx from current.ctx", (done) ->
        Cypress.on "log", (obj) ->
          expect(obj.get("ctx")).not.to.exist
          done()

        Cypress.command({})

      it "omits fn from current.fn", (done) ->
        Cypress.on "log", (obj) ->
          expect(obj.get("fn")).not.to.exist
          done()

        Cypress.command({})

      it "sets testId to runnable.cid", (done) ->
        cy.prop("runnable", {cid: 123})

        Cypress.on "log", (obj) ->
          expect(obj.get("testId")).to.eq 123
          cy.prop("runnable", null)
          done()

        Cypress.command({})

      it "sets numElements if $el", (done) ->
        $el = cy.$("body")

        Cypress.on "log", (obj) ->
          expect(obj.get("numElements")).to.eq 1
          done()

        Cypress.command($el: $el)

      it "sets highlightAttr if $el", (done) ->
        $el = cy.$("body")

        Cypress.on "log", (obj) ->
          expect(obj.get("highlightAttr")).not.to.be.undefined
          expect(obj.get("highlightAttr")).to.eq Cypress.highlightAttr
          done()

        Cypress.command($el: $el)

    it "displays 0 argument", (done) ->
      Cypress.on "log", (obj) ->
        if obj.get("name") is "eq"
          expect(obj.get("message")).to.eq "0"
          done()

      cy.get("div").eq(0)

    it "sets type to 'parent' dual commands when first command", (done) ->
      @sandbox.stub cy.runner, "uncaught"

      Cypress.on "log", (obj) ->
        if obj.get("name") is "then"
          expect(obj.get("type")).to.eq "parent"
          done()

      cy.then ->
        throw new Error("then failure")

    it "sets type to 'child' dual commands when first command", (done) ->
      @sandbox.stub cy.runner, "uncaught"

      Cypress.on "log", (obj) ->
        if obj.get("name") is "then"
          expect(obj.get("type")).to.eq "child"
          done()

      cy.noop({}).then ->
        throw new Error("then failure")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

        cy.on "command:start", ->
          @_timeout(100)

        ## prevent accidentally adding a .then to cy
        return null

      it "preserves errors", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          expect(@log.get("name")).to.eq "get"
          expect(@log.get("message")).to.eq "foo"
          expect(@log.get("error")).to.eq err
          done()

        cy.get("foo")

      it "#onConsole for parent commands", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "get"
            Returned: undefined
            Error: err.toString()
          }
          done()

        cy.get("foo")

      it "#onConsole for dual commands as a parent", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "wait"
            Error: err.toString()
          }
          done()

        cy.wait ->
          expect(true).to.be.false

      it "#onConsole for dual commands as a child", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          if @log.get("name") is "wait"
            expect(@log.attributes.onConsole()).to.deep.eq {
              Command: "wait"
              "Applied To": getFirstSubjectByName("get")
              Error: err.toString()
            }
            done()

        cy.get("button").wait ->
          expect(true).to.be.false

      it "#onConsole for children commands", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          if @log.get("name") is "contains"
            expect(@log.attributes.onConsole()).to.deep.eq {
              Command: "contains"
              Content: "asdfasdfasdfasdf"
              "Applied To": getFirstSubjectByName("get")
              Error: err.toString()
            }
            done()

        cy.get("button").contains("asdfasdfasdfasdf")

      it "#onConsole for nested children commands", (done) ->
        Cypress.on "log", (@log) =>

        cy.on "fail", (err) =>
          if @log.get("name") is "contains"
            expect(@log.attributes.onConsole()).to.deep.eq {
              Command: "contains"
              Content: "asdfasdfasdfasdf"
              "Applied To": getFirstSubjectByName("eq")
              Error: err.toString()
            }
            done()

        cy.get("button").eq(0).contains("asdfasdfasdfasdf")

  context "nested commands", ->
    beforeEach ->
      @setup = (fn = ->) =>
        Cypress.addParentCommand "nested", ->
          cy.chain().url()

        cy
          .inspect()
          .nested()
          .noop()
          .then ->
            fn()

    it "queues in the correct order", ->
      @setup ->
        expect(getNames(cy.queue)).to.deep.eq ["inspect", "nested", "url", "noop", "then", "then"]

    it "nested command should reference url as next property", ->
      @setup ->
        nested = _(cy.queue).find (obj) -> obj.name is "nested"
        expect(nested.next.name).to.eq "url"

    it "null outs nestedIndex prior to restoring", (done) ->
      @setup()
      cy.on "end", ->
        expect(cy.prop("nestedIndex")).to.be.null
        done()

    it "can recursively nest", ->
      Cypress.addParentCommand "nest1", ->
        cy.nest2()

      Cypress.addParentCommand "nest2", ->
        cy.noop()

      cy
        .inspect()
        .nest1()
        .then ->
          expect(getNames(cy.queue)).to.deep.eq ["inspect", "nest1", "nest2", "noop", "then", "then"]

    it "works with multiple nested commands", ->
      Cypress.addParentCommand "multiple", ->
        cy
          .url()
          .location()
          .noop()

      cy
        .inspect()
        .multiple()
        .then ->
          expect(getNames(cy.queue)).to.deep.eq ["inspect", "multiple", "url", "location", "noop", "then", "then"]

  context ".off", ->
    beforeEach ->
      @eventByName = (name) ->
        _(Cypress._events).where({name: name})

    it "can remove event by name", ->
      Cypress.on "foo", ->

      expect(@eventByName("foo")).to.have.length(1)

      Cypress.off "foo"

      expect(@eventByName("foo")).to.have.length(0)

    it "can remove event by name + callback fn", ->
      fn = ->

      Cypress.on "foo", -> "foo"
      Cypress.on "foo", fn

      expect(@eventByName("foo")).to.have.length(2)

      Cypress.off "foo", fn

      expect(@eventByName("foo")).to.have.length(1)

      Cypress.off "foo"

  context ".on", ->
    beforeEach ->
      @eventByName = (name) ->
        _(Cypress._events).where({name: name})

    it "replaces existing events if function matches", ->
      fn = ->

      Cypress.on "foo", fn
      Cypress.on "foo", fn

      expect(@eventByName("foo")).to.have.length(1)

      Cypress.off "foo", fn

    it "replaces existing events if function.toString() matches", ->
      Cypress.on "foo", -> "foo bar baz"
      Cypress.on "foo", -> "foo bar baz"

      expect(@eventByName("foo")).to.have.length(1)

      Cypress.off "foo"

  context "#to", ->
    it "returns the subject for chainability", ->
      cy.noop({foo: "bar"}).to("deep.eq", {foo: "bar"}).then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    it "can use negation", ->
      cy.noop(false).to("not.be.true")

    it "works with jquery chai", ->
      div = $("<div class='foo'>asdf</div>")

      cy.$("body").append(div)

      cy
        .get("div.foo").to("have.class", "foo").then ($div) ->
          expect($div).to.match div
          $div.remove()

    it "can chain multiple assertions", ->
      cy
        .get("body")
          .to("contain", "DOM Fixture")
          .to("have.property", "length", 1)

    it "can change the subject", ->
      cy.get("input:first").should("have.property", "length").to("eq", 1).then (num) ->
        expect(num).to.eq(1)

    it "changes the subject with chai-jquery", ->
      cy.get("input:first").should("have.attr", "id").to("eq", "input")

    it "changes the subject with JSON", ->
      obj = {requestJSON: {teamIds: [2]}}
      cy.noop(obj).its("requestJSON").should("have.property", "teamIds").to("deep.eq", [2])

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "should not be true", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "expected false to be true"
          done()

        cy.noop(false).to("be.true")

      it "throws err when not available chaninable", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "The chainer: 'dee' was not found. Building implicit expectation failed."
          done()

        cy.noop({}).to("dee.eq", {})

      it "throws err when ends with a non available chaninable", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "The chainer: 'eq2' was not found. Building implicit expectation failed."
          done()

        cy.noop({}).to("deep.eq2", {})

  context "#should", ->
    it "proxies to #to", ->
      cy.noop({foo: "bar"}).should("deep.eq", {foo: "bar"})

  context "Utils", ->
    describe "#hasElement", ->
      it "is true on jQuery objects", ->
        body = cy.$("body")
        expect(Cypress.Utils.hasElement(body)).to.be.true

      it "is true on DOM objects", ->
        body = cy.$("body").get(0)
        expect(Cypress.Utils.hasElement(body)).to.be.true

      _.each [{}, [], [{}], 1, "", true], (value) ->
        it "is false on: #{typeof value}", ->
          expect(Cypress.Utils.hasElement(value)).to.be.false

    describe "#stringifyElement", ->
      context "long form", ->
        it "includes wraps element in gt/ls", ->
          input = $("<input />")
          cy.$("body").append(input)

          str = Cypress.Utils.stringifyElement(input)
          expect(str).to.eq "<input>"

      context "short form", ->
        it "returns element", ->
          body = cy.$("body")

          str = Cypress.Utils.stringifyElement(body, "short")
          expect(str).to.eq "<body>"

        it "returns element + id", ->
          div = $("<div id='id' />")
          cy.$("body").append(div)

          str = Cypress.Utils.stringifyElement(div, "short")
          expect(str).to.eq "<div#id>"

        it "uses element class", ->
          div = $("<div class='class foo bar' />")
          cy.$("body").append(div)

          str = Cypress.Utils.stringifyElement(div, "short")
          expect(str).to.eq "<div.class.foo.bar>"

        it "uses name, id, and class", ->
          div = $("<div id='baz' class='foo' />")
          cy.$("body").append(div)

          str = Cypress.Utils.stringifyElement(div, "short")
          expect(str).to.eq "<div#baz.foo>"

      context "#convertHtmlTags", ->
        it "converts opening brackets to tags", ->
          html = Cypress.Utils.convertHtmlTags "[strong]foo"
          expect(html).to.eq "<strong>foo"

        it "converts closing brackets to tags", ->
          html = Cypress.Utils.convertHtmlTags "foo[/strong]"
          expect(html).to.eq "foo</strong>"

        it "converts opening brackets with attrs", ->
          html = Cypress.Utils.convertHtmlTags "[i class='fa-circle']foo"
          expect(html).to.eq "<i class='fa-circle'>foo"

    describe "#plural", ->

  context "Chai", ->
    before ->
      @onAssert = (fn) =>
        Cypress.on "log", (obj) =>
          if obj.get("name") is "assert"
            ## restore so we dont create an endless loop
            ## due to Cypress.assert being called again
            Cypress.Chai.restore()
            fn.call(@, obj)

    beforeEach ->
      Cypress.Chai.override()

    afterEach ->
      Cypress.Chai.restore()

    describe "#patchAssert", ->

      it "wraps \#{this} and \#{exp} in \#{b}", (done) ->
        @onAssert (obj) ->
          expect(obj.get("message")).to.eq "expected [b]foo[\\b] to equal [b]foo[\\b]"
          done()

        cy.then ->
          expect("foo").to.eq "foo"

      it "doesnt mutate error message", ->
        cy.then ->
          try
            expect(true).to.eq false
          catch e
            expect(e.message).to.eq "expected true to equal false"

      describe "jQuery elements", ->
        it "sets _obj to selector", (done) ->
          @onAssert (obj) ->
            expect(obj.get("message")).to.eq "expected [b]<body>[\\b] to exist"
            done()

          cy.get("body").then ($body) ->
            expect($body).to.exist

        describe "without selector", ->
          it "exists", (done) ->
            @onAssert (obj) ->
              expect(obj.get("message")).to.eq "expected [b]<div>[\\b] to exist"
              done()

            ## prepend an empty div so it has no id or class
            cy.$("body").prepend $("<div />")

            cy.get("div").eq(0).then ($div) ->
              # expect($div).to.match("div")
              expect($div).to.exist

          it "uses element name", (done) ->
            @onAssert (obj) ->
              expect(obj.get("message")).to.eq "expected [b]<input>[\\b] to match [b]input[\\b]"
              done()

            ## prepend an empty div so it has no id or class
            cy.$("body").prepend $("<input />")

            cy.get("input").eq(0).then ($div) ->
              expect($div).to.match("input")

        describe "property assertions", ->
          it "has property", (done) ->
            @onAssert (obj) ->
              expect(obj.get("message")).to.eq "expected [b]<form#by-id>[\\b] to have a property [b]length[\\b]"
              done()

            cy.get("form").should("have.property", "length")

    describe "#expect", ->
      it "proxies to chai.expect", ->
        exp = @sandbox.spy chai, "expect"
        Cypress.Chai.expect(true).to.eq.true

        expectOriginal(exp).to.be.calledWith(true)

  describe "#assert", ->
    describe ".log", ->
      before ->
        @onAssert = (fn) =>
          Cypress.on "log", (obj) =>
            if obj.get("name") is "assert"
              ## restore so we dont create an endless loop
              ## due to Cypress.assert being called again
              Cypress.Chai.restore()
              fn.call(@, obj)

      beforeEach ->
        Cypress.Chai.override()

      afterEach ->
        Cypress.Chai.restore()

      it "ends immediately", (done) ->
        @onAssert (log) ->
          expect(log.get("end")).to.be.true
          expect(log.get("state")).to.eq("success")
          done()

        cy.get("body").then ->
          expect(cy.prop("subject")).to.match "body"

      it "snapshots immediately", (done) ->
        @onAssert (log) ->
          expect(log.get("snapshot")).to.be.an("object")
          done()

        cy.get("body").then ->
          expect(cy.prop("subject")).to.match "body"

      it "sets type to child when assertion involved current subject", (done) ->
        @onAssert (log) ->
          expect(log.get("type")).to.eq "child"
          done()

        cy.get("body").then ->
          expect(cy.prop("subject")).to.match "body"

      it "sets type to child current command had arguments but does not match subject", (done) ->
        @onAssert (log) ->
          expect(log.get("type")).to.eq "child"
          done()

        cy.get("body").then ($body) ->
          expect($body.length).to.eq(1)

      it "sets type to parent when assertion did not involve current subject and didnt have arguments", (done) ->
        @onAssert (log) ->
          expect(log.get("type")).to.eq "parent"
          done()

        cy.get("body").then ->
          expect(true).to.be.true

      it "replaces instances of word: 'but' with 'and' for passing assertion", (done) ->
        ## chai jquery adds 2 assertions here so
        ## we bind to the 2nd one
        Cypress.on "log", (log) ->
          if log.get("name") is "assert"
            assert(log)

        assert = _.after 2, (obj) ->
          Cypress.Chai.restore()

          expect(obj.get("message")).to.eq "expected [b]<a>[\\b] to have a [b]<a>[\\b] attribute with the value [b]#[\\b], and the value was [b]#[\\b]"
          done()

        cy.get("a").then ($a) ->
          expect($a).to.have.attr "href", "#"

      it "does not replaces instances of word: 'but' with 'and' for failing assertion", (done) ->
        @sandbox.stub cy.runner, "uncaught"

        ## chai jquery adds 2 assertions here so
        ## we bind to the 2nd one
        Cypress.on "log", (obj) ->
          if obj.get("name") is "assert"
            assert(obj)

        assert = _.after 2, (obj) ->
          Cypress.Chai.restore()
          expect(obj.get("message")).to.eq "expected [b]<a>[\\b] to have a [b]<a>[\\b] attribute with the value [b]asdf[\\b], but the value was [b]#[\\b]"
          done()

        cy.get("a").then ($a) ->
          expect($a).to.have.attr "href", "asdf"

      it "does not replace 'button' with 'andton'", (done) ->
        ## chai jquery adds 2 assertions here so
        ## we bind to the 2nd one
        Cypress.on "log", (obj) ->
          if obj.get("name") is "assert"
            assert(obj)

        assert = _.after 1, (obj) ->
          Cypress.Chai.restore()

          expect(obj.get("message")).to.eq "expected [b]<button#button>[\\b] to be visible"
          done()

        cy.get("#button").then ($button) ->
          expect($button).to.be.visible

      it "#onConsole for regular objects", (done) ->
        @onAssert (obj) ->
          expect(obj.attributes.onConsole()).to.deep.eq {
            Command: "assert"
            expected: 1
            actual: 1
            Message: "expected 1 to equal 1"
          }
          done()

        cy
          .then ->
            expect(1).to.eq 1

      it "#onConsole for DOM objects", (done) ->
        @onAssert (obj) ->
          expect(obj.attributes.onConsole()).to.deep.eq {
            Command: "assert"
            subject: getFirstSubjectByName("get")
            Message: "expected <body> to match body"
          }
          done()

        cy
          .get("body").then ($body) ->
            expect($body).to.match "body"

      it "#onConsole for errors", (done) ->
        @sandbox.stub cy.runner, "uncaught"

        @onAssert (obj) ->
          expect(obj.attributes.onConsole()).to.deep.eq {
            Command: "assert"
            expected: false
            actual: true
            Message: "expected true to be false"
            Error: obj.get("error").stack
          }
          done()

        cy.then ->
          expect(true).to.be.false

  describe "Mocha", ->
    beforeEach ->
      Cypress.Mocha.override()

    afterEach ->
      Cypress.Mocha.restore()

    context "#override", ->
      beforeEach ->
        @chain = cy.noop({foo: "foo"}).assign("foo")

        ## simulate not returning cy from beforeEach
        return null

      it "forcibly returns cy chainer", ->
        ## foo should still be defined since
        ## the beforeEach should have waited
        ## for cy to complete!
        expect(@foo).to.deep.eq {foo: "foo"}

      it "does not create a new chainer", ->
        ## mocha will attach a .then() to the coerced
        ## return value from the override.  if we dont
        ## return the chain, then mocha will automatically
        ## create a new chainer by attaching this to cy.then()
        ## instead of the correct cy.chain().then()
        ## we can verify this by ensuring the last chain
        ## is what is carried over to the test
        expect(@chain.id).to.eq(cy.chain().id)


