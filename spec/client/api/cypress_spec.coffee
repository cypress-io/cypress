getNames = (queue) ->
  _(queue).pluck("name")

describe "Cypress API", ->
  before ->
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
      Cypress.setup(runner, @iframe, {}, ->)

    ## if we've changed the src by navigating
    ## away (aka cy.visit(...)) then we need
    ## to reload the fixture again and then setup
    if /dom/.test(@iframe.attr("src"))
      @setup()
    else
      @loadDom().then @setup

  afterEach ->
    Cypress.abort()

  after ->
    Cypress.stop()

  context "#url", ->
    it "returns the location href", ->
      cy.url().then (url) ->
        expect(url).to.eq "/fixtures/html/dom.html"

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
        autoRespond: true
        autoRespondAfter: 10
        afterResponse: ->
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
          url: "/foo"
          response: {}
          onRequest: undefined
          onResponse: undefined
        })

    it "accepts regex url, response", ->
      cy.route(/foo/, {}).then ->
        @expectOptionsToBe({
          method: "GET"
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
          url: "/foo"
          response: {}
          onRequest: onRequest
          onResponse: onResponse
        })

    it "accepts method, url, response", ->
      cy.route("GET", "/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
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
          response: {}
          onRequest: onRequest
          onResponse: onResponse
        })

    it "uppercases method", ->
      cy.route("get", "/foo", {}).then ->
        @expectOptionsToBe({
          method: "GET"
          url: "/foo"
          response: {}
        })

    it "accepts string or regex as the url", ->
      cy.route("get", /.*/, {}).then ->
        @expectOptionsToBe({
          method: "GET"
          url: /.*/
          response: {}
        })

    it "accepts an object literal as options", ->
      onRequest = ->
      onResponse = ->

      opts = {
        method: "PUT"
        url: "/foo"
        response: {}
        onRequest: onRequest
        onResponse: onResponse
      }

      cy.route(opts).then ->
        @expectOptionsToBe(opts)

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

  context "#ng", ->
    context "find by binding", ->
      beforeEach ->
        @currentTest.timeout(800)
        @loadDom("html/angular").then @setup

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
            expect(err.message).to.include "Angular global was not found in your window! You cannot use .ng() methods without angular."
            done()

          cy.ng("binding", "phone")

        it "throws when binding cannot be found", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "Could not find element for binding: 'not-found'!"
            done()

          cy.ng("binding", "not-found")

        it "cancels additional finds when aborted", (done) ->
          _.delay ->
            Cypress.abort()
          , 200

          cy.ng("binding", "not-found")

          cy.on "fail", (err) ->
            done(err)

          cy.on "cancel", =>
            retry = @sandbox.spy cy, "_retry"
            _.delay ->
              expect(retry.callCount).to.eq 0
              done()
            , 100

    context "find by repeater", ->
      ngPrefixes = {"phone in phones": 'ng-', "phone2 in phones": 'ng_', "phone3 in phones": 'data-ng-', "phone4 in phones": 'x-ng-'}

      beforeEach ->
        ## make this test timeout quickly so
        ## we dont have to wait so damn long
        @currentTest.timeout(800)
        @loadDom("html/angular").then @setup

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
        _.delay =>
          cy.$("body").append(missingLi)
          # debugger
        , @test.timeout() - 300

        cy.ng("repeater", "li in lis").then ($li) ->
          expect($li).to.match missingLi

      describe "errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it "throws when repeater cannot be found", (done) ->
          cy.ng("repeater", "not-found")

          cy.on "fail", (err) ->
            expect(err.message).to.include "Could not find element for repeater: 'not-found'.  Searched [ng-repeat*='not-found'], [ng_repeat*='not-found'], [data-ng-repeat*='not-found'], [x-ng-repeat*='not-found']."
            done()

        it "cancels additional finds when aborted", (done) ->
          _.delay ->
            Cypress.abort()
          , 200

          cy.ng("repeater", "not-found")

          cy.on "fail", (err) ->
            done(err)

          cy.on "cancel", =>
            retry = @sandbox.spy cy, "_retry"
            _.delay ->
              expect(retry.callCount).to.eq 0
              done()
            , 100

        it "throws when cannot find angular", (done) ->
          delete cy.sync.window().angular

          cy.on "fail", (err) ->
            expect(err.message).to.include "Angular global was not found in your window! You cannot use .ng() methods without angular."
            done()

          cy.ng("repeater", "phone in phones")

    context "find by model", ->
      ngPrefixes = {query: 'ng-', query2: 'ng_', query3: 'data-ng-', query4: 'x-ng-'}

      beforeEach ->
        @currentTest.timeout(800)
        @loadDom("html/angular").then @setup

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
        _.delay =>
          cy.$("body").append(missingInput)
        , @test.timeout() - 300

        cy.ng("model", "missing-input").then ($input) ->
          expect($input).to.match missingInput

      describe "errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it "throws when model cannot be found", (done) ->
          cy.ng("model", "not-found")

          cy.on "fail", (err) ->
            expect(err.message).to.include "Could not find element for model: 'not-found'.  Searched [ng-model='not-found'], [ng_model='not-found'], [data-ng-model='not-found'], [x-ng-model='not-found']."
            done()

        it "cancels additional finds when aborted", (done) ->
          _.delay ->
            Cypress.abort()
          , 200

          cy.ng("model", "not-found")

          cy.on "fail", (err) ->
            done(err)

          cy.on "cancel", =>
            retry = @sandbox.spy cy, "_retry"
            _.delay ->
              expect(retry.callCount).to.eq 0
              done()
            , 100

        it "throws when cannot find angular", (done) ->
          delete cy.sync.window().angular

          cy.on "fail", (err) ->
            expect(err.message).to.include "Angular global was not found in your window! You cannot use .ng() methods without angular."
            done()

          cy.ng("model", "query")

  context "#visit", ->
    it "returns a promise", ->
      promise = cy.command("visit", "/foo")
      expect(promise).to.be.instanceOf(Promise)

    it "triggers visit:start on the remote iframe", (done) ->
      $("iframe").on "visit:start", (e, url) ->
        expect(url).to.eq "/foo"
        done()

      cy.visit("/foo")

    it "resolves the subject to the remote iframe window", ->
      cy.visit("/foo").then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

    it "changes the src of the iframe to the initial src", ->
      cy.visit("/foo").then ->
        src = $("iframe").attr("src")
        expect(src).to.eq "/__remote/foo?__initial=true"

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

      _.delay ->
        cy.$("head").append $("<title>waiting on title</title>")
      , 500

      cy.title().then (text) ->
        expect(text).to.eq "waiting on title"

    it "retries until it has the correct title", ->
      cy.$("title").text("home page")

      _.delay ->
        cy.$("title").text("about page")
      , 500

      cy.inspect().title().until (title) ->
        expect(title).to.eq "about page"

    it "throws after timing out", (done) ->
      @sandbox.stub cy.runner, "uncaught"
      @test.timeout(500)
      cy.$("title").remove()
      cy.title()
      cy.on "fail", (err) ->
        expect(err.message).to.include "Could not find element: title"
        done()

  context "#fill", ->
    it "requires an object literal", (done) ->
      @sandbox.stub cy.runner, "uncaught"

      cy.get("form").fill("")

      cy.on "fail", (err) ->
        expect(err.message).to.include "cy.fill() must be passed an object literal as its 1st argument!"
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

  context "#get", ->
    beforeEach ->
      ## make this test timeout quickly so
      ## we dont have to wait so damn long
      @currentTest.timeout(800)

    it "finds by selector", ->
      list = cy.$("#list")

      cy.get("#list").then ($list) ->
        expect($list).to.match list

    it "retries finding elements until something is found", ->
      missingEl = $("<div />", id: "missing-el")

      ## wait until we're ALMOST about to time out before
      ## appending the missingEl
      _.delay =>
        cy.$("body").append(missingEl)
      , @test.timeout() - 300

      cy.get("#missing-el").then ($div) ->
        expect($div).to.match missingEl

    it "retries until .until resolves to true", ->
      _.delay =>
        cy.$("#list li").last().remove()
      , @test.timeout() - 300

      cy.get("#list li").until ($list) ->
        expect($list.length).to.eq 2

    it "does not throw when could not find element and was told not to retry", ->
      cy.get("#missing-el", {retry: false}).then ($el) ->
        expect($el).not.to.exist

    describe "alias references", ->
      it "re-queries for an existing alias", ->
        body = cy.$("body")

        cy.get("body").as("b").get("@b").then ($body) ->
          expect($body.get(0)).to.eq body.get(0)

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

  context "#contains", ->
    it "finds the nearest element by :contains selector", ->
      cy.contains("li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("li")

    it "has an optional filter argument", ->
      cy.contains("ul", "li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("ul")

    it "can find input type=submits by value", ->
      cy.contains("input contains submit").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match "input[type=submit]"

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

    it "retries until content is found", ->
      span = $("<span>brand new content</span>")

      _.delay ->
        cy.$("head").append span
      , 500

      cy.contains("brand new content").then ($span) ->
        expect($span).to.match span

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"
        @currentTest.timeout(500)

      it "throws any elements when timing out and no filter", (done) ->
        cy.contains("brand new content")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any elements containing the content: brand new content"
          done()

      it "throws specific selector when timing out with a filter", (done) ->
        cy.contains("span", "brand new content")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find the selector: <span> containing the content: brand new content"
          done()

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
        cy.noop({}).clear()

        cy.on "fail", (err) -> done()

      it "throws if any subject isnt a textarea", (done) ->
        cy.get("textarea,form").clear()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <form id=\"by-id\"></form>"
          done()

      it "throws if any subject isnt a :text", (done) ->
        cy.get("div").clear()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <div id=\"dom\"></div>"
          done()

      it "throws on an input radio", (done) ->
        cy.get(":radio").clear()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"radio\" name=\"gender\" value=\"male\">"
          done()

      it "throws on an input checkbox", (done) ->
        cy.get(":checkbox").clear()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"checkbox\" name=\"colors\" value=\"blue\">"
          done()

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
        cy.on "fail", (err) ->
          expect(err.message).to.include ".submit() can only be called on a <form>! Your subject contains a: <input id=\"input\">"
          done()

        cy.get("input").submit()

  context "#click", ->
    it "sends a click event", (done) ->
      cy.$("#button").click -> done()

      cy.get("#button").click()

    it "returns the original subject", ->
      button = cy.$("#button")

      cy.get("#button").click().then ($button) ->
        expect($button).to.match button

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

      count = cy.$("button").length

      cy.on "invoke:end", (obj) =>
        if obj.name is "click"
          expect(@test.timeout()).to.eq (count * 10) + prevTimeout
          done()

      cy.get("button").click()

    describe "errors", ->
      it "throws when not a dom subject", (done) ->
        @sandbox.stub cy.runner, "uncaught"

        cy.click()

        cy.on "fail", -> done()

  context "invoke", ->
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
          expect(cy.prop("href")).to.eq "/fixtures/html/dom.html"
        .visit("/foo").then ->
          expect(cy.prop("href")).to.eq "foo"

  context "#isReady", ->
    it "creates a deferred when not ready", ->
      cy.isReady(false)
      keys = _.keys cy.prop("ready")
      expect(keys).to.include("promise", "resolve", "reject")

    it "resolves the deferred when ready", (done) ->
      cy.isReady(false)
      cy.isReady(true)
      cy.on "ready", (bool) ->
        expect(cy.prop("ready").promise.isResolved()).to.be.true
        done()

    it "prevents a bug creating an additional .then promise", (done) ->
      cy.isReady(false)
      cy.isReady(true)

      cy.on "end", ->
        expect(cy.queue.length).to.eq(1)
        done()

      cy.noop({})

  context "jquery proxy methods", ->
    fns = [
      {find: "*"}
      {each: -> $(@).removeClass().addClass("foo")}
      {filter: ":first"}
      {map: -> $(@).text()}
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

  context "#then", ->
    it "assigns prop next if .then was added by mocha"

  context "#run", ->
    it "does not call clearTimeout on the runnable if it already has a state", (done) ->
      ## this prevents a bug where if we arent an async test, done() callback
      ## will be invoked first, giving our runnable a state.  if we didnt
      ## check against this state then we would resetTimeout again, and in
      ## 5 seconds it would time out again

      cy.on "command:start", =>
        @ct = @sandbox.spy cy.prop("runnable"), "clearTimeout"

      cy.on "command:end", =>
        expect(@ct.callCount).to.eq 0
        done()

      cy.then ->
        cy.prop("runnable").state = "foo"

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
      expect(cy.prop("href")).to.eq "/fixtures/html/dom.html"

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

  context ".restore", ->
    it "removes bound events", ->
      cy.on "foo", ->
      cy.on "bar", ->
      Cypress.restore()
      expect(cy._events).to.be.undefined

  context "property registry", ->
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

      it "sets zero", ->
        @set "zero", 0

      it "sets null", ->
        @set "null", null

      it "sets empty string", ->
        @set "string", ""

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

      it "retries when undefined", (done) ->
        i = 0
        fn = ->
          i += 1
        fn = @sandbox.spy fn
        cy.noop({}).then(fn).until (i) ->
          if i isnt 2 then undefined else true
        cy.on "end", ->
          expect(fn.callCount).to.eq 2
          done()

    describe "errors thrown", ->
      beforeEach ->
        @uncaught = @sandbox.stub(cy.runner, "uncaught")

      it "times out eventually due to false value", (done) ->
        ## forcibly reduce the timeout to 500 ms
        ## so we dont have to wait so long
        cy
          .noop()
          .until (-> false), timeout: 500

        cy.on "fail", (err) ->
          expect(err.message).to.include "The final value was: false"
          done()

      it "appends to the err message", (done) ->
        cy
          .noop()
          .until (-> expect(true).to.be.false), timeout: 500

        cy.on "fail", (err) ->
          expect(err.message).to.include "Timed out retrying. Could not continue due to: AssertionError"
          done()

  context "#wait", ->
    describe "number argument", ->
      it "passes delay onto Promise", ->
        delay = @sandbox.spy Promise, "delay"
        cy.wait(100)
        cy.on "invoke:end", (obj) ->
          if obj.name is "wait"
            expect(delay).to.be.calledWith 100

      it "does not change the subject", ->
        cy
          .get("input")
          .then ($input) ->
            @$input = $input
          .wait(10)

        cy.on "invoke:end", (obj) =>
          if obj.name is "wait"
            expect(cy.prop("subject")).to.eq @$input

      it "does not time out the runnable", ->
        timer = @sandbox.useFakeTimers("setTimeout")
        trigger = @sandbox.spy(cy, "trigger")
        cy._timeout(100)
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
          cy.wait (-> false), timeout: 500

          cy.on "fail", (err) ->
            expect(err.message).to.include "The final value was: false"
            done()

        it "appends to the err message", (done) ->
          cy.wait (-> expect(true).to.be.false), timeout: 500

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

      describe "errors", ->
        beforeEach ->
          @sandbox.stub cy.runner, "uncaught"

        it "throws when alias doesnt match a route", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.include "cy.wait() can only accept aliases for routes.  The alias: 'b' did not match a route."
            done()

          cy.get("body").as("b").wait("@b")

        it  "throws when route is never resolved", (done) ->
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

  context "nested commands", ->
    beforeEach ->
      @setup = (fn = ->) =>
        Cypress.addParentCommand "nested", ->
          cy.url()

        cy
          .inspect()
          .nested()
          .noop()
          .then -> fn()

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