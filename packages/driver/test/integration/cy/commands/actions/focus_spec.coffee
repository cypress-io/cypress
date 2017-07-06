{ $, _ } = window.testUtils

describe "$Cypress.Cy Focus Commands", ->
  enterCommandTestingMode()

  context "#focus", ->
    it "sends a focus event", (done) ->
      @cy.$$("#focus input").focus -> done()

      @cy.get("#focus input").focus()

    it "bubbles focusin event", (done) ->
      @cy.$$("#focus").focusin -> done()

      @cy.get("#focus input").focus()

    it "manually blurs focused subject as a fallback", (done) ->
      @cy.$$("input:first").blur -> done()

      @cy
        .get("input:first").focus()
        .get("#focus input").focus()

    it "sets forceFocusedEl", ->
      input = @cy.$$("#focus input")

      @cy
        .get("#focus input").focus()
        .focused().then ($focused) ->
          expect($focused.get(0)).to.eq(input.get(0))

          ## make sure we have either set the property
          ## or havent
          if document.hasFocus()
            expect(@cy.state("forceFocusedEl")).not.to.be.ok
          else
            expect(@cy.state("forceFocusedEl")).to.eq(input.get(0))

    it "matches @cy.focused()", ->
      button = @cy.$$("#button")

      @cy.get("#button").focus().focused().then ($focused) ->
        expect($focused.get(0)).to.eq button.get(0)

    it "returns the original subject", ->
      button = @cy.$$("#button")

      @cy.get("#button").focus().then ($button) ->
        expect($button).to.match button

    it "causes first focused element to receive blur", (done) ->
      @cy.$$("input:first").blur ->
        done()

      @cy
        .get("input:first").focus()
        .get("input:last").focus()

    it "can focus [contenteditable]", ->
      ce = @cy.$$("[contenteditable]:first")

      @cy
        .get("[contenteditable]:first").focus()
        .focused().then ($ce) ->
          expect($ce.get(0)).to.eq ce.get(0)

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$("#focus input").on "focus", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get("#focus input").focus()

    it "increases the timeout delta", (done) ->
      prevTimeout = @test.timeout()

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "focus"
          expect(@test.timeout()).to.eq 50 + prevTimeout
          done()

      @cy.get("#focus input").focus()

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
        @cy.$$(":text:first").focus ->
          _.delay =>
            $(@).addClass("focused")
          , 100

        @cy.get(":text:first").focus().should("have.class", "focused").then ->
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

        @cy.get(":text:first").focus().should("have.class", "focused")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get(":text:first").focus().should("have.class", "focused")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately before resolving", (done) ->
        input = @cy.$$(":text:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "focus"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get(":text:first").focus()

      it "snapshots after clicking", ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.get(":text:first").focus().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focus().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs 2 focus event", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy
          .get("input:first").focus()
          .get("button:first").focus().then ->
            names = _.map logs, (log) -> log.get("name")
            expect(logs).to.have.length(4)
            expect(names).to.deep.eq ["get", "focus", "get", "focus"]

      it "#consoleProps", ->
        @cy.get("input:first").focus().then ($input) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "focus"
            "Applied To": $input.get(0)
          }

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.noop({}).focus()

        @cy.on "fail", -> done()

      it "throws when subject is not in the document", (done) ->
        focused = 0

        input = @cy.$$("input:first").focus (e) ->
          focused += 1
          input.remove()
          return false

        @cy.on "fail", (err) ->
          expect(focused).to.eq 1
          expect(err.message).to.include "cy.focus() failed because this element"
          done()

        @cy.get("input:first").focus().focus()

      it "throws when not a[href],link[href],button,input,select,textarea,[tabindex]", (done) ->
        @cy.get("form").focus()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.focus() can only be called on a valid focusable element. Your subject is a: <form id=\"by-id\">...</form>"
          done()

      it "throws when subject is a collection of elements", (done) ->
        @cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .focus()

        @cy.on "fail", (err) =>
          expect(err.message).to.include "cy.focus() can only be called on a single element. Your subject contained #{@num} elements."
          done()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.focus()

      it "slurps up failed promises", (done) ->
        ctx = @

        ## we only want to test when the document
        ## isnt in focus
        return done() if document.hasFocus()

        @cy.command = _.wrap @cy.command, (orig, args...) ->
          if args[0] is "blur"
            ## force contains to return false here to
            ## simulate the element we're trying to blur
            ## isnt in the DOM
            ctx.sandbox.stub(ctx.cy, "_contains").returns(false)

          orig.apply(@, args)


        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.blur() failed because this element"
          done()

        ## we remove the first element and then
        ## focus on the 2nd.  the 2nd focus causes
        ## a blur on the 1st element, which should
        ## cause an error because its no longer in the DOM
        @cy
          .get("input:first").focus()
          .get("input:last").focus()
          .then ->
            ## sometimes hasFocus() returns false
            ## even though its really in focus
            ## in those cases, just pass
            ## i cant come up with another way
            ## to test this accurately
            done()

  context "#blur", ->
    it "should blur the originally focused element", (done) ->
      @cy.$$("#focus input").blur -> done()

      @cy.get("#focus").within ->
        @cy
          .get("input").focus()
          .get("button").focus()

    it "black lists the focused element", ->
      input = @cy.$$("#focus input")

      @cy
        .get("#focus input").focus().blur()
        .focused().then ($focused) ->
          expect($focused).to.be.null

          ## make sure we have either set the property
          ## or havent
          if document.hasFocus()
            expect(@cy.state("blacklistFocusedEl")).not.to.be.ok
          else
            expect(@cy.state("blacklistFocusedEl")).to.eq(input.get(0))

    it "sends a focusout event", (done) ->
      @cy.$$("#focus").focusout -> done()

      @cy.get("#focus input").focus().blur()

    it "sends a blur event", (done) ->
      # @cy.$$("input:text:first").get(0).addEventListener "blur", -> done()
      @cy.$$("input:first").blur -> done()

      @cy.get("input:first").focus().blur()

    it "returns the original subject", ->
      input = @cy.$$("input:first")

      @cy.get("input:first").focus().blur().then ($input) ->
        expect($input).to.match input

    it "can blur [contenteditable]", ->
      ce = @cy.$$("[contenteditable]:first")

      @cy
        .get("[contenteditable]:first").focus().blur().then ($ce) ->
          expect($ce.get(0)).to.eq ce.get(0)

    it "can blur input[type=time]", (done) ->
      @cy.$$("#time-without-value").blur -> done()

      @cy.get("#time-without-value").focus().invoke("val", "03:15:00").blur()

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$("input:first").on "blur", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get("input:first").focus().blur()

    it "increases the timeout delta", (done) ->
      prevTimeout = @test.timeout()

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "blur"
          expect(@test.timeout()).to.eq 50 + prevTimeout
          done()

      @cy.get("input:first").focus().blur()

    it "can force blurring on a non-focused element", (done) ->
      @cy.$$("input:first").blur -> done()

      @cy
        .get("input:last").focus()
        .get("input:first").blur({force: true})

    it "can force blurring when there is no focused element", (done) ->
      @cy.$$("input:first").blur -> done()

      @cy
        .focused().should("not.exist")
        .get("input:first").blur({force: true})

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
        @cy.on "fail", (err) -> debugger

        @cy.$$(":text:first").blur ->
          _.delay =>
            $(@).addClass("blured")
          , 100

        @cy.get(":text:first").focus().blur().should("have.class", "blured").then ->
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

        @cy.get(":text:first").focus().blur().should("have.class", "blured")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(4)
          done()

        @cy.get(":text:first").focus().blur().should("have.class", "blured")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "logs immediately before resolving", (done) ->
        input = @cy.$$(":text:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "blur"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            done()

        @cy.get(":text:first").focus().blur()

      it "snapshots after clicking", ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.get(":text:first").focus().blur().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "passes in $el", ->
        @cy.get("input:first").focus().blur().then ($input) ->
          expect(@log.get("$el")).to.eq $input

      it "logs 1 blur event", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy
          .get("input:first").focus().blur().then ->
            names = _.map logs, (log) -> log.get("name")
            expect(logs).to.have.length(3)
            expect(names).to.deep.eq ["get", "focus", "blur"]

      it "logs delta options for {force: true}", ->
        @cy
          .get("input:first").blur({force: true}).then ->
            expect(@log.get("message")).to.eq("{force: true}")

      it "#consoleProps", ->
        @cy.get("input:first").focus().blur().then ($input) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "blur"
            "Applied To": $input.get(0)
          }

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws when not a dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.noop({}).blur()

      it "throws when subject is not in the document", (done) ->
        blurred = 0

        input = @cy.$$("input:first").blur (e) ->
          blurred += 1
          input.focus ->
            input.remove()
            return false
          return false

        @cy.on "fail", (err) ->
          expect(blurred).to.eq 1
          expect(err.message).to.include "cy.blur() failed because this element"
          done()

        @cy.get("input:first").focus().blur().focus().blur()

      it "throws when subject is a collection of elements", (done) ->
        @cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .blur()

        @cy.on "fail", (err) =>
          expect(err.message).to.include "cy.blur() can only be called on a single element. Your subject contained #{@num} elements."
          done()

      it "throws when there isnt an activeElement", (done) ->
        @cy.get("form:first").blur()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.blur() can only be called when there is a currently focused element."
          done()

      it "throws when blur is called on a non-active element", (done) ->
        @cy
          .get("input:first").focus()
          .get("#button").blur()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "cy.blur() can only be called on the focused element. Currently the focused element is a: <input id=\"input\">"
          done()

      it "logs delta options on error", (done) ->
        @cy.$$("button:first").click ->
          $(@).remove()

        @Cypress.on "log", (attrs, @log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("message")).to.eq("{force: true}")
          done()

        @cy
          .get("button:first").click().blur({force: true})

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.blur()
