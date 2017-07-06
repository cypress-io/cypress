{ $, _ } = window.testUtils

describe "$Cypress.Cy Querying Commands", ->
  enterCommandTestingMode()

  context "#focused", ->
    it "returns the activeElement", ->
      button = @cy.$$("#button")
      button.get(0).focus()

      @cy.focused().then ($focused) ->
        expect($focused.get(0)).to.eq(button.get(0))

    it "returns null if no activeElement", ->
      button = @cy.$$("#button")
      button.get(0).focus()
      button.get(0).blur()

      @cy.focused().then ($focused) ->
        expect($focused).to.be.null

    it "uses forceFocusedEl if set", ->
      input = @cy.$$("input:first")
      @cy.state("forceFocusedEl", input.get(0))

      @cy.focused().then ($focused) ->
        expect($focused.get(0)).to.eq input.get(0)

    it "does not use forceFocusedEl if that el is not in the document", ->
      input = @cy.$$("input:first")

      @cy
        .get("input:first").focus().focused().then ->
          input.remove()
        .focused().then ($el) ->
          expect($el).to.be.null

    it "nulls forceFocusedEl if that el is not in the document", ->
      input = @cy.$$("input:first")

      @cy
        .get("input:first").focus().focused().then ->
          input.remove()
        .focused().then ($el) ->
          expect(cy.state("forceFocusedEl")).to.be.null

    it "refuses to use blacklistFocusedEl", ->
      input = @cy.$$("input:first")
      @cy.state("blacklistFocusedEl", input.get(0))

      @cy
        .get("input:first").focus()
        .focused().then ($focused) ->
          expect($focused).to.be.null

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(300)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          @cy.$$(":text:first").addClass("focused").focus()

        @cy.focused().should("have.class", "focused").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.focused().should("have.class", "focused")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.focused().should("have.class", "focused")

    describe ".log", ->
      beforeEach ->
        @cy.$$("input:first").get(0).focus()
        @Cypress.on "log", (attrs, @log) =>

      it "is a parent command", ->
        @cy.get("body").focused().then ->
          expect(@log.get("type")).to.eq "parent"

      it "ends immediately", ->
        @cy.focused().then ->
          expect(@log.get("ended")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.focused().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focused().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "#consoleProps", ->
        @cy.get("input:first").focused().then ($input) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "focused"
            Yielded: $input.get(0)
            Elements: 1
          }

      it "#consoleProps with null element", ->
        @cy.focused().blur().focused().then ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "focused"
            Yielded: "--nothing--"
            Elements: 0
          }

  context "#within", ->
    it "scopes additional GET finders to the subject", ->
      input = @cy.$$("#by-name input:first")

      @cy.get("#by-name").within ->
        @cy.get("input:first").then ($input) ->
          expect($input.get(0)).to.eq input.get(0)

    it "scopes additional CONTAINS finders to the subject", ->
      span = @cy.$$("#nested-div span:contains(foo)")

      @cy.contains("foo").then ($span) ->
        expect($span.get(0)).not.to.eq span.get(0)

      @cy.get("#nested-div").within ->
        @cy.contains("foo").then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

    it "does not change the subject", ->
      form = @cy.$$("#by-name")

      @cy.get("#by-name").within(->).then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "can call child commands after within on the same subject", ->
      input = @cy.$$("#by-name input:first")

      @cy.get("#by-name").within(->).find("input:first").then ($input) ->
        expect($input.get(0)).to.eq input.get(0)

    it "supports nested withins", ->
      span = @cy.$$("#button-text button span")

      @cy.get("#button-text").within ->
        @cy.get("button").within ->
          @cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span.get(0)

    it "supports complicated nested withins", ->
      span1 = @cy.$$("#button-text a span")
      span2 = @cy.$$("#button-text button span")

      @cy.get("#button-text").within ->
        @cy.get("a").within ->
          @cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span1.get(0)

        @cy.get("button").within ->
          @cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span2.get(0)

    it "clears withinSubject after within is over", ->
      input = @cy.$$("input:first")
      span = @cy.$$("#button-text button span")

      @cy.get("#button-text").within ->
        @cy.get("button").within ->
          @cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span.get(0)

      @cy.get("input:first").then ($input) ->
        expect($input.get(0)).to.eq input.get(0)

    it "removes command:start listeners after within is over", ->
      @cy.get("#button-text").within ->
        @cy.get("button").within ->
          @cy.get("span")

      @cy.then ->
        expect(@cy._events).not.to.have.property "command:start"

    it "clears withinSubject even if next is null", (done) ->
      span = @cy.$$("#button-text button span")

      @cy.on "end", ->
        ## should be defined here because next would have been
        ## null and withinSubject would not have been cleared
        expect(@state("withinSubject")).not.to.be.undefined

        _.defer =>
          expect(@state("withinSubject")).to.be.null
          done()

      @cy.get("#button-text").within ->
        @cy.get("button span").then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "can silence logging", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log) if log.name is "within"

        @cy.get("div:first").within({log: false}, ->).then ->
          expect(logs.length).to.eq(0)

      it "logs immediately before resolving", (done) ->
        div = @cy.$$("div:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "within"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("")
            expect(log.get("$el").get(0)).to.eq div.get(0)
            done()

        @cy.get("div:first").within ->

      it "snapshots after clicking", ->
        @cy.get("div:first").within ->
          @cy.then ->
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.noop().within ->

      it "throws when not a DOM subject", (done) ->
        @cy.on "fail", (err) -> done()

        @cy.noop().within ->

      _.each ["", [], {}, 1, null, undefined], (value) =>
        it "throws if passed anything other than a function, such as: #{value}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.within() must be called with a function."
            done()

          @cy.get("body").within(value)

      it "throws when subject is not in the document", (done) ->
        @cy.on "command:end", =>
          @cy.$$("#list").remove()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.within() failed because this element"
          done()

        @cy.get("#list").within ->

  context "#root", ->
    it "returns html", ->
      html = @cy.$$("html")

      @cy.root().then ($html) ->
        expect($html.get(0)).to.eq html.get(0)

    it "returns withinSubject if exists", ->
      form = @cy.$$("form")

      @cy.get("form").within ->
        @cy
          .get("input")
          .root().then ($root) ->
            expect($root.get(0)).to.eq form.get(0)

    it "eventually resolves", ->
      _.delay =>
        @cy.$$("html").addClass("foo").addClass("bar")
      , 100

      @cy.root().should("have.class", "foo").and("have.class", "bar")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "can turn off logging", ->
        @cy.root({log: false}).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "root"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("")
            done()

        @cy.root()

      it "snapshots after clicking", ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.root().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "sets $el to document", ->
        html = @cy.$$("html")

        @cy.root().then ->
          expect(@log.get("$el").get(0)).to.eq(html.get(0))

      it "sets $el to withinSubject", ->
        form = @cy.$$("form")

        @cy.get("form").within ->
          @cy
            .get("input")
            .root().then ($root) ->
              expect(@log.get("$el").get(0)).to.eq(form.get(0))

      it "consoleProps", ->
        @cy.root().then ($root) ->
          consoleProps = @log.attributes.consoleProps()
          expect(consoleProps).to.deep.eq {
            Command: "root"
            Yielded: $root.get(0)
          }

  context "#get", ->
    beforeEach ->
      ## make this test timeout quickly so
      ## we dont have to wait so damn long
      @currentTest.timeout(300)

    it "finds by selector", ->
      list = @cy.$$("#list")

      @cy.get("#list").then ($list) ->
        expect($list.get(0)).to.eq list.get(0)

    it "retries finding elements until something is found", ->
      missingEl = $("<div />", id: "missing-el")

      ## wait until we're ALMOST about to time out before
      ## appending the missingEl
      @cy.on "retry", (options) =>
        if options.total + (options._interval * 4) > options._runnableTimeout
          @cy.$$("body").append(missingEl)

      @cy.get("#missing-el").then ($div) ->
        expect($div).to.match missingEl

    it "can increase the timeout", ->
      missingEl = $("<div />", id: "missing-el")

      ## make our runnable timeout after 100ms
      @cy._timeout(100)

      @cy.on "retry", (options) =>
        ## make sure runnableTimeout is 10secs
        expect(options._runnableTimeout).to.eq 10000

        ## we shouldnt have a timer either
        expect(@cy.privateState("runnable")).not.to.have.property("timer")

      ## but wait 300ms
      _.delay =>
        @cy.$$("body").append(missingEl)
      , 300

      @cy.get("#missing-el", {timeout: 10000})

    it "does not factor in the total time the test has been running", ->
      missingEl = $("<div />", id: "missing-el")

      @cy.on "retry", _.after 2, =>
        @cy.$$("body").append(missingEl)

      ## in this example our test has been running 200ms
      ## but the timeout is below this amount, and it
      ## still passes because the total running time is
      ## not factored in (which is correct)
      @cy
        .wait(200)
        .get("#missing-el", {timeout: 125})
        .then ->
          ## it should reset the timeout back
          ## to 300 after successfully finished get method
          expect(@cy._timeout()).to.eq 300

    it "cancels existing promises", (done) ->
      logs = []

      @Cypress.on "log", (attrs, log) ->
        logs.push(log)

      retrys = 0

      abort = _.after 2, =>
        @Cypress.abort()

      @cy.on "cancel", ->
        _.delay ->
          expect(retrys).to.eq(2)
          done()
        , 500

      @cy.on "retry", ->
        retrys += 1
        abort()

      @cy.get("doesNotExist")

    describe "custom elements", ->
      ## <foobarbazquux>custom element</foobarbazquux>

      it "can get a custom element", ->
        @cy.get("foobarbazquux").should("contain", "custom element")

      it "can alias a custom element", ->
        @cy
          .get("foobarbazquux:last").as("foo")
          .get("div:first")
          .get("@foo").should("contain", "custom element")

      it "can find a custom alias again when detached from DOM", ->
        @cy
          .get("foobarbazquux:last").as("foo")
          .then ->
            ## remove the existing foobarbazquux
            @cy.$$("foobarbazquux").remove()

            ## and cause it to be re-rendered
            @cy.$$("body").append(@cy.$$("<foobarbazquux>asdf</foobarbazquux>"))

          .get("@foo").should("contain", "asdf")

    describe "deprecated command options", ->
      beforeEach ->
        @allowErrors()

      it "throws on {exist: false}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{exist: false}' have been deprecated. Instead write this as an assertion: cy.should('not.exist')."
          done()

        @cy.get("ul li", {exist: false})

      it "throws on {exists: true}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{exists: true}' have been deprecated. Instead write this as an assertion: cy.should('exist')."
          done()

        @cy.get("ul li", {exists: true, length: 10})

      it "throws on {visible: true}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{visible: true}' have been deprecated. Instead write this as an assertion: cy.should('be.visible')."
          done()

        @cy.get("ul li", {visible: true})


      it "throws on {visible: false}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{visible: false}' have been deprecated. Instead write this as an assertion: cy.should('not.be.visible')."
          done()

        @cy.get("ul li", {visible: false})

      it "throws on {length: 3}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{length: 3}' have been deprecated. Instead write this as an assertion: cy.should('have.length', '3')."
          done()

        @cy.get("ul li", {length: 3})

    describe "should('exist')", ->
      it "waits until button exists", ->
        @cy.on "retry", _.after 3, =>
          @cy.$$("body").append $("<div id='missing-el'>missing el</div>")

        @cy.get("#missing-el").should("exist")

    describe "should('not.exist')", ->
      it "waits until button does not exist", ->
        @cy.on "retry", _.after 3, =>
          @cy.$$("#button").remove()

        @cy.get("#button").should("not.exist")

      it "returns null when cannot find element", ->
        @cy.get("#missing-el").should("not.exist").then ($el) ->
          expect($el).to.be.null

      it "retries until cannot find element", ->
        ## add 500ms to the delta
        @cy._timeout(500, true)

        retry = _.after 3, =>
          @cy.$$("#list li:last").remove()

        @cy.on "retry", retry

        @cy.get("#list li:last").should("not.exist").then ($el) ->
          expect($el).to.be.null

    describe "visibility is unopinionated", ->
      it "finds invisible elements by default", ->
        button = @cy.$$("#button").hide()

        @cy.get("#button").then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe "should('not.be.visible')", ->
      it "returns invisible element", ->
        button = @cy.$$("#button").hide()

        # @cy.get("#button").then ($button) ->
          # expect($button).not.to.be.visible

        @cy.get("#button").should("not.be.visible").then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

      it "retries until element is invisible", ->
        ## add 500ms to the delta
        @cy._timeout(500, true)

        button = null

        retry = _.after 3, =>
          button = @cy.$$("#button").hide()

        @cy.on "retry", retry

        @cy.get("#button").should("not.be.visible").then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe "should('be.visible')", ->
      it "returns visible element", ->
        button = @cy.$$("#button")

        @cy.get("#button").should("be.visible").then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

      it "retries until element is visible", ->
        ## add 500ms to the delta
        @cy._timeout(500, true)

        button = @cy.$$("#button").hide()

        retry = _.after 3, =>
          button.show()

        @cy.on "retry", retry

        @cy.get("#button").should("be.visible").then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe "should('have.length', n)", ->
      it "resolves once length equals n", ->
        forms = @cy.$$("form")

        @cy.get("form").should("have.length", forms.length).then ($forms) ->
          expect($forms.length).to.eq forms.length

      it "retries until length equals n", ->
        buttons = @cy.$$("button")

        length = buttons.length - 2

        @cy.on "retry", _.after 2, =>
          buttons.last().remove()
          buttons = @cy.$$("button")

        ## should resolving after removing 2 buttons
        @cy.get("button").should("have.length", length).then ($buttons) ->
          expect($buttons.length).to.eq length

      it "retries an alias when not enough elements found", ->
        buttons = @cy.$$("button")

        length = buttons.length + 1

        ## add another button after 2 retries, once
        @cy.on "retry", _.after 2, _.once =>
          $("<button />").appendTo @cy.$$("body")

        ## should eventually resolve after adding 1 button
        @cy
          .get("button").as("btns")
          .get("@btns").should("have.length", length).then ($buttons) ->
            expect($buttons.length).to.eq length

      it "retries an alias when too many elements found without replaying commands", ->
        buttons = @cy.$$("button")

        length = buttons.length - 2

        _replayFrom = @sandbox.spy(@cy, "_replayFrom")

        ## add another button after 2 retries, once
        @cy.on "retry", _.after 2, =>
          buttons.last().remove()
          buttons = @cy.$$("button")

        ## should eventually resolve after adding 1 button
        @cy
          .get("button").as("btns")
          .get("@btns").should("have.length", length).then ($buttons) ->
            expect(_replayFrom).not.to.be.called
            expect(@cy.queue.length).to.eq(6) ## we should not have replayed any commands
            expect($buttons.length).to.eq length

    describe "assertion verification", ->
      it "automatically retries", ->
        _.delay =>
          @cy.$$("button:first").attr("data-foo", "bar")
        , 100

        @cy.get("button:first").should("have.attr", "data-foo").and("match", /bar/)

      it "eventually resolves an alias", ->
        @cy.on "retry", _.after 2, =>
          @cy.$$("button:first").addClass("foo-bar-baz")

        @cy
          .get("button:first").as("btn")
          .get("@btn").should("have.class", "foo-bar-baz")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      ## FIXME: fails when all test files are run together
      it.skip "logs elements length", ->
        buttons = @cy.$$("button")

        length = buttons.length - 2

        @cy.on "retry", _.after 2, =>
          buttons.last().remove()
          buttons = @cy.$$("button")

        ## should resolving after removing 2 buttons
        @cy.get("button").should("have.length", length).then ($buttons) ->
          expect(@log.get("numElements")).to.eq length

      it "logs exist: false", ->
        @cy.get("#does-not-exist").should("not.exist").then ->
          expect(@log.get("message")).to.eq "#does-not-exist"
          expect(@log.get("$el").get(0)).not.to.be.ok

      it "logs route aliases", ->
        @cy
          .visit("http://localhost:3500/fixtures/xhr.html")
          .server()
          .route(/users/, {}).as("getUsers")
          .window().then (win) ->
            win.$.get("/users")
          .get("@getUsers").then ->
            expect(@log.pick("message", "referencesAlias", "aliasType")).to.deep.eq {
              message: "@getUsers"
              referencesAlias: "getUsers"
              aliasType: "route"
            }

      it "logs primitive aliases", (done) ->
        @Cypress.on "log", (attrs, log) ->
          expect(log.pick("$el", "numRetries", "referencesAlias", "aliasType")).to.deep.eq {
            referencesAlias: "f"
            aliasType: "primitive"
          }
          done()

        @cy
          .noop("foo").as("f")
          .get("@f")

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (attrs, log) ->
          expect(log.pick("state", "referencesAlias", "aliasType")).to.deep.eq {
            state: "pending"
            referencesAlias: undefined
            aliasType: "dom"
          }
          done()

        @cy.get("body")

      it "snapshots and ends when consuming an alias", ->
        @cy
          .get("body").as("b")
          .get("@b").then ->
            expect(@log.get("ended")).to.be.true
            expect(@log.get("state")).to.eq("passed")
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

      it "logs obj once complete", ->
        @cy.get("body").as("b").then ($body) ->
          obj = {
            state: "passed"
            name: "get"
            message: "body"
            alias: "b"
            aliasType: "dom"
            referencesAlias: undefined
            $el: $body
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "#consoleProps", ->
        @cy.get("body").then ($body) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "get"
            Selector: "body"
            Yielded: $body.get(0)
            Elements: 1
          }

      it "#consoleProps with an alias", ->
        @cy.get("body").as("b").get("@b").then ($body) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "get"
            Alias: "@b"
            Yielded: $body.get(0)
            Elements: 1
          }

      it "#consoleProps with a primitive alias", ->
        @cy.noop({foo: "foo"}).as("obj").get("@obj").then (obj) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "get"
            Alias: "@obj"
            Yielded: obj
          }

      it "#consoleProps with a route alias", ->
        @cy
          .server()
          .route(/users/, {}).as("getUsers")
          .visit("http://localhost:3500/fixtures/xhr.html")
          .window().then (win) ->
            win.$.get("/users")
          .get("@getUsers").then (obj) ->
            expect(@log.attributes.consoleProps()).to.deep.eq {
              Command: "get"
              Alias: "@getUsers"
              Yielded: obj
            }

    describe "alias references", ->
      it "can get alias primitives", ->
        cy
          .noop("foo").as("f")
          .get("@f").then (foo) ->
            expect(foo).to.eq "foo"

      it "can get alias objects", ->
        cy
          .noop({}).as("obj")
          .get("@obj").then (obj) ->
            expect(obj).to.deep.eq {}

      it "re-queries for an existing alias", ->
        body = @cy.$$("body")

        @cy.get("body").as("b").get("@b").then ($body) ->
          expect($body.get(0)).to.eq body.get(0)

      it "re-queries the dom if any element in an alias isnt in the document", ->
        inputs = @cy.$$("input")

        @cy
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

      describe "route aliases", ->
        it "returns the xhr", ->
          @cy
            .server()
            .route(/users/, {}).as("getUsers")
            .visit("http://localhost:3500/fixtures/xhr.html")
            .window().then (win) ->
              win.$.get("/users")
            .get("@getUsers").then (xhr) ->
              expect(xhr.url).to.include "/users"

        it "returns null if no xhr is found", ->
          @cy
            .server()
            .route(/users/, {}).as("getUsers")
            .visit("http://localhost:3500/fixtures/xhr.html")
            .get("@getUsers").then (xhr) ->
              expect(xhr).to.be.null

        it "returns an array of xhrs", ->
          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/users/, {}).as("getUsers")
            .window().then (win) ->
              win.$.get("/users", {num: 1})
              win.$.get("/users", {num: 2})
            .get("@getUsers.all").then (xhrs) ->
              expect(xhrs).to.be.an("array")
              expect(xhrs[0].url).to.include "/users?num=1"
              expect(xhrs[1].url).to.include "/users?num=2"

        it "returns the 1st xhr", ->
          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/users/, {}).as("getUsers")
            .window().then (win) ->
              win.$.get("/users", {num: 1})
              win.$.get("/users", {num: 2})
            .get("@getUsers.1").then (xhr1) ->
              expect(xhr1.url).to.include "/users?num=1"

        it "returns the 2nd xhr", ->
          @cy
            .visit("http://localhost:3500/fixtures/xhr.html")
            .server()
            .route(/users/, {}).as("getUsers")
            .window().then (win) ->
              win.$.get("/users", {num: 1})
              win.$.get("/users", {num: 2})
            .get("@getUsers.2").then (xhr2) ->
              expect(xhr2.url).to.include "/users?num=2"

        it "returns the 3rd xhr as null", ->
          @cy
            .server()
            .route(/users/, {}).as("getUsers")
            .visit("http://localhost:3500/fixtures/xhr.html")
            .window().then (win) ->
              win.$.get("/users", {num: 1})
              win.$.get("/users", {num: 2})
            .get("@getUsers.3").then (xhr3) ->
              expect(xhr3).to.be.null

      # it "re-queries the dom if any element in an alias isnt visible", ->
      #   inputs = @cy.$$("input")
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

      #   @cy.get("input:text:first").type(df).then ($input) ->
      #     expect($input).to.have.value("iphone")

      # it "handles saving subjects", ->
      #   @cy.noop({foo: "foo"}).assign("foo").noop(@cy.get("foo")).then (subject) ->
      #     expect(subject).to.deep.eq {foo: "foo"}

      # it "resolves falsy arguments", ->
      #   @cy.noop(0).assign("zero").then ->
      #     expect(@cy.get("zero")).to.eq 0

      # it "returns a function when no alias was found", ->
      #   @cy.noop().then ->
      #     expect(@cy.get("something")).to.be.a("function")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws once when incorrect sizzle selector", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq 1
          done()

        @cy.get(".spinner'")

      it "throws on too many elements after timing out waiting for length", (done) ->
        buttons = @cy.$$("button")

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Too many elements found. Found '#{buttons.length}', expected '#{buttons.length - 1}'."
          done()

        @cy.get("button").should("have.length", buttons.length - 1)

      it "throws on too few elements after timing out waiting for length", (done) ->
        buttons = @cy.$$("button")

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Not enough elements found. Found '#{buttons.length}', expected '#{buttons.length + 1}'."
          done()

        @cy.get("button").should("have.length", buttons.length + 1)

      it "throws after timing out not finding element", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected to find element: '#missing-el', but never found it."
          done()

        @cy.get("#missing-el")

      it "throws after timing out not finding element when should exist", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected to find element: '#missing-el', but never found it."
          done()

        @cy.get("#missing-el").should("exist")

      it "throws existence error without running assertions", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected to find element: '#missing-el', but never found it."
          done()

        @cy.get("#missing-el").should("have.prop", "foo")

      it "throws when using an alias that does not exist"

      it "throws after timing out after a .wait() alias reference", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected to find element: 'getJsonButton', but never found it."
          done()

        @cy
          .server()
          .route(/json/, {foo: "foo"}).as("getJSON")
          .visit("http://localhost:3500/fixtures/xhr.html").then ->
            @cy.$$("#get-json").click =>
              @cy._timeout(1000)

              retry = _.after 3, _.once =>
                @cy.privateState("window").$.getJSON("/json")

              @cy.on "retry", retry
          .get("#get-json").as("getJsonButton").click()
          .wait("@getJSON")
          .get("getJsonButton")

      it "throws after timing out while not trying to find an element", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected <div#dom> not to exist in the DOM, but it was continuously found."
          done()

        @cy.get("div:first").should("not.exist")

      it "throws after timing out while trying to find an invisible element", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "expected '<div#dom>' not to be visible"
          done()

        @cy.get("div:first").should("not.be.visible")

      it "does not include message about why element was not visible", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).not.to.include "why this element is not visible"
          done()

        @cy.get("div:first").should("not.be.visible")

      it "throws after timing out trying to find a visible element", (done) ->
        @cy.$$("#button").hide()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "expected '<button#button>' to be visible"
          done()

        @cy.get("#button").should("be.visible")

      it "includes a message about why the element was not visible", (done) ->
        @cy.$$("#button").hide()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "element (<button#button>) is not visible because"
          done()

        @cy.get("#button").should("be.visible")

      it "sets error command state", (done) ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq "failed"
          expect(@log.get("error")).to.eq err
          done()

        @cy.get("foobar")

      it "throws when alias property is '0'", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "'0' is not a valid alias property. Are you trying to ask for the first response? If so write @getUsers.1"
          done()

        @cy
          .server()
          .route(/users/, {}).as("getUsers")
          .get("@getUsers.0")

      it "throws when alias property isnt just a digit", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "'1b' is not a valid alias property. Only 'numbers' or 'all' is permitted."
          done()

        @cy
          .server()
          .route(/users/, {}).as("getUsers")
          .get("@getUsers.1b")

      it "throws when alias property isnt a digit or 'all'", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "'all ' is not a valid alias property. Only 'numbers' or 'all' is permitted."
          done()

        @cy
          .server()
          .route(/users/, {}).as("getUsers")
          .get("@getUsers.all ")

      it "logs out $el when existing $el is found even on failure", (done) ->
        button = @cy.$$("#button").hide()

        @Cypress.on "log", (attrs, @log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.eq err
          expect(@log.get("$el").get(0)).to.eq button.get(0)
          consoleProps = @log.attributes.consoleProps()
          expect(consoleProps.Yielded).to.eq button.get(0)
          expect(consoleProps.Elements).to.eq button.length
          done()

        @cy.get("#button").should("be.visible")

  context "#contains", ->
    it "is scoped to the body and will not return title elements", ->
      @cy.contains("DOM Fixture").then ($el) ->
        expect($el).not.to.match("title")

    it "finds the nearest element by :contains selector", ->
      @cy.contains("li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("li")

    it "resets the subject between chain invocations", ->
      span = @cy.$$(".k-in:contains(Quality Control):last")
      label = @cy.$$("#complex-contains label")

      @cy.get("#complex-contains").contains("nested contains").then ($label) ->
        expect($label.get(0)).to.eq label.get(0)
        return $label
      @cy.contains("Quality Control").then ($span) ->
        expect($span.get(0)).to.eq span.get(0)

    it "GET is scoped to the current subject", ->
      span = @cy.$$("#click-me a span")

      @cy.get("#click-me a").contains("click").then ($span) ->
        expect($span.length).to.eq(1)
        expect($span.get(0)).to.eq span.get(0)

    it "can find input type=submits by value", ->
      @cy.contains("input contains submit").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match "input[type=submit]"

    it "has an optional filter argument", ->
      @cy.contains("ul", "li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("ul")

    it "disregards priority elements when provided a filter", ->
      form = @cy.$$("#click-me")

      @cy.contains("form", "click me").then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "favors input type=submit", ->
      input = @cy.$$("#input-type-submit input")

      @cy.contains("click me").then ($input) ->
        expect($input.get(0)).to.eq(input.get(0))

    it "favors buttons next", ->
      button = @cy.$$("#button-inside-a button")

      @cy.contains("click button").then ($btn) ->
        expect($btn.get(0)).to.eq(button.get(0))

    it "favors anchors next", ->
      @cy.contains("Home Page").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("a")

    it "reduces right by priority element", ->
      label = @cy.$$("#complex-contains label")

      ## it should find label because label is the first priority element
      ## out of the collection of contains elements
      @cy.get("#complex-contains").contains("nested contains").then ($label) ->
        expect($label.get(0)).to.eq label.get(0)

    it "retries until content is found", ->
      span = $("<span>brand new content</span>")

      ## only append the span after we retry
      ## three times
      retry = _.after 3, =>
        @cy.$$("body").append span

      @cy.on "retry", retry

      @cy.contains("brand new content").then ($span) ->
        expect($span.get(0)).to.eq span.get(0)

    it "finds the furthest descendent when filter matches more than 1 element", ->
      @cy
        .get("#contains-multiple-filter-match").contains("li", "Maintenance").then ($row) ->
          expect($row).to.have.class("active")

    it "returns the parent node which contains content spanned across a child element and text node", ->
      item = @cy.$$("#upper .item")

      @cy.contains("New York").then ($item) ->
        expect($item).to.be.ok
        expect($item.get(0)).to.eq item.get(0)

    it "finds text by regexp and restores contains", ->
      contains = $.expr[":"].contains

      @cy.contains(/^asdf \d+/).then ($li) ->
        expect($li).to.have.text("asdf 1")
        expect($.expr[":"].contains).to.eq(contains)

    it "returns elements found first when multiple siblings found", ->
      @cy.contains("li", "asdf").then ($li) ->
        expect($li).to.have.text("asdf 1")

    it "returns first ul when multiple uls", ->
      @cy.contains("ul", "jkl").then ($ul) ->
        expect($ul.find("li:first")).to.have.text("jkl 1")

    it "cancels existing promises", (done) ->
      getSync = @sandbox.spy(@cy.get, "immediately")

      retrys = 0

      abort = _.after 2, =>
        @Cypress.abort()

      @cy.on "cancel", ->
        _.delay ->
          expect(getSync.callCount).to.be.within(2, 3)
          expect(retrys).to.eq(2)
          done()
        , 50

      @cy.on "retry", ->
        retrys += 1
        abort()

      @cy.contains("DOES NOT CONTAIN THIS!")

    describe "deprecated command options", ->
      beforeEach ->
        @allowErrors()

      it "throws on {exist: false}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{exist: false}' have been deprecated. Instead write this as an assertion: cy.should('not.exist')."
          done()

        @cy.contains("asdfasdf", {exist: false})

      it "throws on {exists: true}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{exists: true}' have been deprecated. Instead write this as an assertion: cy.should('exist')."
          done()

        @cy.contains("button", {exists: true, length: 10})

      it "throws on {visible: true}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{visible: true}' have been deprecated. Instead write this as an assertion: cy.should('be.visible')."
          done()

        @cy.contains("button", {visible: true})


      it "throws on {visible: false}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{visible: false}' have been deprecated. Instead write this as an assertion: cy.should('not.be.visible')."
          done()

        @cy.get("ul li").contains("foo", {visible: false})

      it "throws on {length: 3}", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Command Options such as: '{length: 3}' have been deprecated. Instead write this as an assertion: cy.should('have.length', '3')."
          done()

        @cy.contains("foo", {length: 3})

    describe "should('not.exist')", ->
      it "returns null when no content exists", ->
        @cy.contains("alksjdflkasjdflkajsdf").should("not.exist").then ($el) ->
          expect($el).to.be.null

    describe "should('be.visible')", ->
      it "returns invisible element", ->
        span = @cy.$$("#not-hidden").hide()

        @cy.contains("span", "my hidden content").should("not.be.visible").then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

      it "returns invisible element when parent chain is visible", ->
        @cy.get("#form-header-region").contains("Back").should("not.be.visible")

    describe.skip "handles whitespace", ->
      it "finds el with new lines", ->
        btn = $("""
          <button id="whitespace">
          White
          space
          </button>
          """).appendTo @cy.$$("body")

        @cy.contains("White space").then ($btn) ->
          expect($btn.get(0)).to.eq btn.get(0)

    describe "subject contains text nodes", ->
      it "searches for content within subject", ->
        badge = @cy.$$("#edge-case-contains .badge:contains(5)")

        @cy.get("#edge-case-contains").find(".badge").contains(5).then ($badge) ->
          expect($badge.get(0)).to.eq badge.get(0)

      it "returns the first element when subject contains multiple elements", ->
        badge = @cy.$$("#edge-case-contains .badge-multi:contains(1)")

        @cy.get("#edge-case-contains").find(".badge-multi").contains(1).then ($badge) ->
          expect($badge.length).to.eq(1)
          expect($badge.get(0)).to.eq badge.get(0)

      it "returns the subject when it has a text node of matching content", ->
        count = @cy.$$("#edge-case-contains .count:contains(2)")

        @cy.get("#edge-case-contains").find(".count").contains(2).then ($count) ->
          expect($count.length).to.eq(1)
          expect($count.get(0)).to.eq count.get(0)

      it "retries until it finds the subject has the matching text node", ->
        count = $("<span class='count'>100</span>")
        retried3Times = false

        ## make sure it retries 3 times.
        retry = _.after 3, =>
          retried3Times = true
          @cy.$$("#edge-case-contains").append(count)

        @cy.on "retry", retry

        @cy.get("#edge-case-contains").contains(100).then ($count) ->
          expect(retried3Times).to.be.true
          expect($count.length).to.eq(1)
          expect($count.get(0)).to.eq count.get(0)

      it "retries until it finds a filtered contains has the matching text node", ->
        count = $("<span class='count'>100</span>")
        retried3Times = false

        retry = _.after 3, =>
          retried3Times = true
          @cy.$$("#edge-case-contains").append(count)

        @cy.on "retry", retry

        @cy.get("#edge-case-contains").contains(".count", 100).then ($count) ->
          expect(retried3Times).to.be.true
          expect($count.length).to.eq(1)
          expect($count.get(0)).to.eq count.get(0)

      it "returns the first matched element when multiple match and there is no filter", ->
        icon = @cy.$$("#edge-case-contains i:contains(25)")

        @cy.get("#edge-case-contains").contains(25).then ($icon) ->
          expect($icon.length).to.eq(1)
          expect($icon.get(0)).to.eq icon.get(0)

    describe "special characters", ->
      _.each "' \" [ ] { } . @ # $ % ^ & * ( ) , ; :".split(" "), (char) ->
        it "finds content with character: #{char}", ->
          span = $("<span>special char #{char} content</span>").appendTo @cy.$$("body")

          @cy.contains("span", char).then ($span) ->
            expect($span.get(0)).to.eq span.get(0)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "contains"
            expect(log.pick("state", "type")).to.deep.eq {
              state: "pending"
              type: "child"
            }
            done()

        @cy.get("body").contains("foo")

      it "snapshots and ends after finding element", ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.contains("foo").then ->
          expect(@log.get("ended")).to.be.true
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "silences internal @cy.get() log", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        ## GOOD: [ {name: get} , {name: contains} ]
        ## BAD:  [ {name: get} , {name: get} , {name: contains} ]
        @cy.get("#complex-contains").contains("nested contains").then ($label) ->
          names = _.map logs, (log) -> log.get("name")
          expect(logs).to.have.length(2)
          expect(names).to.deep.eq ["get", "contains"]

      it "passes in $el", ->
        @cy.get("#complex-contains").contains("nested contains").then ($label) ->
          expect(@log.get("$el")).to.eq $label

      it "sets type to parent when used as a parent command", ->
        @cy.contains("foo").then ->
          expect(@log.get("type")).to.eq "parent"

      it "sets type to parent when subject doesnt have an element", ->
        @cy.noop({}).contains("foo").then ->
          expect(@log.get("type")).to.eq "parent"

      it "sets type to child when used as a child command", ->
        @cy.get("body").contains("foo").then ->
          expect(@log.get("type")).to.eq "child"

      it "logs when not exists", ->
        @cy.contains("does-not-exist").should("not.exist").then ->
          expect(@log.get("message")).to.eq "does-not-exist"
          expect(@log.get("$el").length).to.eq(0)

      it "logs when should be visible with filter", ->
        @cy.contains("div", "Nested Find").should("be.visible").then ($div) ->
          expect(@log.get("message")).to.eq "div, Nested Find"
          expect(@log.get("$el")).to.eq $div

      it "#consoleProps", ->
        @cy.get("#complex-contains").contains("nested contains").then ($label) ->
          consoleProps = @log.attributes.consoleProps()
          expect(consoleProps).to.deep.eq {
            Command: "contains"
            Content: "nested contains"
            "Applied To": getFirstSubjectByName.call(@, "get").get(0)
            Yielded: $label.get(0)
            Elements: 1
          }

    describe "errors", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(200)

      _.each [undefined, null], (val) ->
        it "throws when text is #{val}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq("cy.contains() can only accept a string, number or regular expression.")
            done()

          @cy.contains(val)

      it "throws on a blank string", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.contains() cannot be passed an empty string."
          done()

        @cy.contains("")

      it "logs once on error", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        @cy.on "fail", (err) ->
          expect(logs).to.have.length(1)
          done()

        @cy.contains(undefined)

      it "throws when there is no filter and no subject", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected to find content: 'brand new content' but never did."
          done()

        @cy.contains("brand new content")

      it "throws when there is a filter", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected to find content: 'brand new content' within the selector: 'span' but never did."
          done()

        @cy.contains("span", "brand new content")

      it "throws when there is no filter but there is a subject", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected to find content: '0' within the element: <div.badge> but never did."
          done()

        @cy.get("#edge-case-contains").find(".badge").contains(0)

      it "throws when there is both a subject and a filter", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected to find content: 'foo' within the element: <div#edge-case-contains> and with the selector: 'ul' but never did."
          done()

        @cy.get("#edge-case-contains").contains("ul", "foo")

      it "throws after timing out while not trying to find an element that contains content", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Expected not to find content: 'button' but continuously found it."
          done()

        @cy.contains("button").should("not.exist")

      it "logs out $el when existing $el is found even on failure", (done) ->
        button = @cy.$$("#button")

        @Cypress.on "log", (attrs, @log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.eq err
          expect(@log.get("$el").get(0)).to.eq button.get(0)
          consoleProps = @log.attributes.consoleProps()
          expect(consoleProps.Yielded).to.eq button.get(0)
          expect(consoleProps.Elements).to.eq button.length
          done()

        @cy.contains("button").should("not.exist")

      it "throws when assertion is have.length > 1", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq 1
          expect(err.message).to.eq "cy.contains() cannot be passed a length option because it will only ever return 1 element."
          done()

        @cy.contains("Nested Find").should("have.length", 2)

      it "restores contains even when cy.get fails", (done) ->
        contains = $.expr[":"].contains

        cyExecute = @cy.execute

        @cy.on "fail", (err) ->
          expect(err.message).to.include("Syntax error, unrecognized expression")
          expect($.expr[":"].contains).to.eq(contains)
          done()

        execute = ->
          cyExecute.call(@, "get", "aBad:jQuery^Selector", {})

        @sandbox.stub(@cy, "execute", execute)

        cy.contains(/^asdf \d+/)

      it "restores contains on abort", (done) ->
        @timeout(1000)

        contains = $.expr[":"].contains

        @cy.on "cancel", ->
          _.delay ->
            expect($.expr[":"].contains).to.eq(contains)
            done()
          , 50

        @cy.on "retry", _.after 2, ->
          @Cypress.abort()

        @cy.contains(/^does not contain asdfasdf at all$/)
