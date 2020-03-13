$ = Cypress.$.bind(Cypress)
_ = Cypress._

getActiveElement = ->
  cy.state("document").activeElement

describe "src/cy/commands/actions/focus", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#focus", ->
    it "sends a focus event",  ->
      focus = false

      cy.$$("#focus input").focus ->
        focus = true

      cy.get("#focus input").focus().then ($input) ->
        expect(focus).to.be.true
        expect(getActiveElement()).to.eq($input.get(0))

    it "bubbles focusin event",  ->
      focusin = false

      cy.$$("#focus").focusin ->
        focusin = true

      cy.get("#focus input").focus().then ->
        expect(focusin).to.be.true

    it "manually blurs focused subject as a fallback", ->
      blurred = false

      cy.$$("input:first").blur ->
        blurred = true

      cy
        .get("input:first").focus()
        .get("#focus input").focus()
        .then ->
          expect(blurred).to.be.true

    it "matches cy.focused()", ->
      button = cy.$$("#button")

      cy
      .get("#button").focus().focused()
      .then ($focused) ->
        expect($focused.get(0)).to.eq button.get(0)

    it "returns the original subject", ->
      button = cy.$$("#button")

      cy.get("#button").focus().then ($button) ->
        expect($button).to.match button

    it "causes first focused element to receive blur", ->
      blurred = false

      cy.$$("input:first").blur ->
        blurred = true

      cy
        .get("input:first").focus()
        .get("input:last").focus()
        .then ->
          expect(blurred).to.be.true

    ## https://allyjs.io/data-tables/focusable.html#footnote-3
    ## body is focusable, but it will not steal focus away
    ## from another activeElement or cause any focus or blur events
    ## to fire
    it "can focus the body but does not fire focus or blur events", ->
      { body } = doc = cy.state("document")

      focused = false
      blurred = false

      onFocus = ->
        focused = true

      onBlur = ->
        blurred = true

      cy
      .get("input:first").focus().then ($input) ->
        expect(doc.activeElement).to.eq($input.get(0))

        $input.get(0).addEventListener("blur", onBlur)
        body.addEventListener("focus", onFocus)

        cy.get("body").focus().then ->
          ## should not have changed actual activeElement
          expect(doc.activeElement).to.eq($input.get(0))

          $input.get(0).removeEventListener("blur", onBlur)
          body.removeEventListener("focus", onFocus)

          expect(focused).to.be.false
          expect(blurred).to.be.false

    it "can focus the window but does not change activeElement or fire blur events", ->
      win = cy.state("window")
      doc = cy.state("document")

      focused = false
      blurred = false

      onFocus = ->
        focused = true

      onBlur = ->
        blurred = true

      cy
      .get("input:first").focus().then ($input) ->
        expect(doc.activeElement).to.eq($input.get(0))

        $input.get(0).addEventListener("blur", onBlur)
        win.addEventListener("focus", onFocus)

        cy.window().focus().then ->
          ## should not have changed actual activeElement
          expect(doc.activeElement).to.eq($input.get(0))

          $input.get(0).removeEventListener("blur", onBlur)
          win.removeEventListener("focus", onFocus)

          expect(focused).to.be.true
          expect(blurred).to.be.false

    it "can focus [contenteditable]", ->
      ce = cy.$$("[contenteditable]:first")

      cy
        .get("[contenteditable]:first").focus()
        .focused().then ($ce) ->
          expect($ce.get(0)).to.eq ce.get(0)

    it "can focus svg elements", ->
      onFocus = cy.stub()

      cy.$$("[data-cy=rect]").focus(onFocus)

      cy.get("[data-cy=rect]").focus().then ->
        expect(onFocus).to.be.calledOnce

    it "can focus on readonly inputs", ->
      onFocus = cy.stub()

      cy.$$("#readonly-attr").focus(onFocus)

      cy.get("#readonly-attr").focus().then ->
        expect(onFocus).to.be.calledOnce

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.$$(":text:first").focus ->
          _.delay =>
            $(@).addClass("focused")
          , 100

        cy.get(":text:first").focus().should("have.class", "focused").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "focus"
            @lastLog = log
            @logs.push(log)

        return null

      it "logs immediately before resolving", ->
        $input = cy.$$(":text:first")

        expected = false

        ## we can't end early here because our focus()
        ## command will still be in flight and the promise
        ## chain will get canceled before it gets attached
        ## (besides the code will continue to run and create
        ## side effects)
        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "focus"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq $input.get(0)
            expected = true

        cy.get(":text:first").focus().then ->
          expect(expected).to.be.true

      it "snapshots after clicking", ->
        cy.get(":text:first").focus().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "passes in $el", ->
        cy.get("input:first").focus().then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("$el")).to.eq $input

      it "logs 2 focus event", ->
        cy
          .get("input:first").focus()
          .get("button:first").focus().then ->
            expect(@logs.length).to.eq(2)

      it "#consoleProps", ->
        cy.get("input:first").focus().then ($input) ->
          expect(@lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "focus"
            "Applied To": $input.get(0)
          }

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when not a dom subject", (done) ->
        cy.on "fail", -> done()

        cy.noop({}).focus()

      it "throws when subject is not in the document", (done) ->
        focused = 0

        $input = cy.$$("input:first").focus (e) ->
          focused += 1
          $input.remove()
          return false

        cy.on "fail", (err) ->
          expect(focused).to.eq 1
          expect(err.message).to.include "`cy.focus()` failed because this element"
          done()

        cy.get("input:first").focus().focus()

      it "throws when not a[href],link[href],button,input,select,textarea,[tabindex]", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.focus()` can only be called on a valid focusable element. Your subject is a: `<form id=\"by-id\">...</form>`"
          expect(err.docsUrl).to.eq("https://on.cypress.io/focus")
          done()

        cy.get("form").focus()

      it "throws when subject is a collection of elements", (done) ->
        cy
          .get("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .focus()

        cy.on "fail", (err) =>
          expect(err.message).to.include "`cy.focus()` can only be called on a single element. Your subject contained #{@num} elements."
          expect(err.docsUrl).to.eq("https://on.cypress.io/focus")
          done()

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.focus()

      ## TODO: dont skip this
      it.skip "slurps up failed promises", (done) ->
        cy.timeout(1000)

        ## we only want to test when the document
        ## isnt in focus
        if cy.state("document").hasFocus()
          return done()

        # now = cy.now
        #
        # nowFn = (cmd) ->
        #   ## we stub cy.now so that when we're about to blur
        #   ## we cause isInDom to return false when its given
        #   ## the last input element
        #   if cmd is "blur"
        #     cy.stub(cy, "isInDom").returns(false)
        #
        #   now.apply(@, arguments)
        #
        # cy.stub(cy, "now", nowFn)

        $first = cy.$$("input:first")
        $last = cy.$$("input:last")

        $first.on "focus", ->
          $(@).remove()

        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.blur()` failed because this element"
          done()

        ## we remove the first element and then
        ## focus on the 2nd.  the 2nd focus causes
        ## a blur on the 1st element, which should
        ## cause an error because its no longer in the DOM
        cy
          .get("input:first").focus()
          .get("input:last").focus()
          .then ->
            ## sometimes hasFocus() returns false
            ## even though its really in focus
            ## in those cases, just pass
            ## i cant come up with another way
            ## to test this accurately
            done()

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get(":text:first").focus().should("have.class", "focused")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get(":text:first").focus().should("have.class", "focused")

  context "#blur", ->
    it "should blur the originally focused element", ->
      blurred = false

      cy.$$("#focus input").blur ->
        blurred = true

      cy.get("#focus").within ->
        cy
        .get("input").focus()
        .then ($input) ->
          expect(getActiveElement()).to.eq($input.get(0))

        .get("button").focus()
        .then ($btn) ->
          expect(blurred).to.be.true
          expect(getActiveElement()).to.eq($btn.get(0))

    it "sends a focusout event", ->
      focusout = false

      cy.$$("#focus").focusout ->
        focusout = true

      cy.get("#focus input").focus().blur().then ->
        expect(focusout).to.be.true

    it "sends a blur event", ->
      # cy.$$("input:text:first").get(0).addEventListener "blur", -> done()
      blurred = false

      cy.$$("input:first").blur ->
        blurred = true

      cy.get("input:first").focus().blur().then ->
        expect(blurred).to.be.true

    it "returns the original subject", ->
      input = cy.$$("input:first")

      cy.get("input:first").focus().blur().then ($input) ->
        expect($input).to.match input

    it "can blur the body but does not change activeElement or fire blur events", ->
      { body } = doc = cy.state("document")

      blurred = false

      onBlur = ->
        blurred = true

      body.addEventListener("blur", onBlur)

      cy
      .get("body").blur().then ->
        expect(blurred).to.be.false
      .get("input:first").focus().then ($input) ->
        cy
        .get("body").blur({ force: true })
        .then ->
          expect(doc.activeElement).to.eq($input.get(0))
          body.removeEventListener("blur", onBlur)

          expect(blurred).to.be.false

    it "can blur the window but does not change activeElement", ->
      win = cy.state("window")
      doc = cy.state("document")

      blurred = false

      onBlur = ->
        blurred = true

      win.addEventListener("blur", onBlur)

      cy
      .window().blur().then ->
        expect(blurred).to.be.true
      .get("input:first").focus().then ($input) ->
        cy
        .window().blur({ force: true })
        .then ->
          expect(doc.activeElement).to.eq($input.get(0))
          win.removeEventListener("blur", onBlur)

    it "can blur [contenteditable]", ->
      ce = cy.$$("[contenteditable]:first")

      cy
        .get("[contenteditable]:first").focus().blur().then ($ce) ->
          expect($ce.get(0)).to.eq ce.get(0)

    it "can blur input[type=time]", ->
      blurred = false

      cy.$$("#time-without-value").blur ->
        blurred = true

      cy
        .get("#time-without-value").focus().invoke("val", "03:15:00").blur()
        .then ->
          expect(blurred).to.be.true

    it "can blur tabindex", ->
      blurred = false

      cy
      .$$("#comments").blur ->
        blurred = true
      .get(0).focus()

      cy.get("#comments").blur().then ->
        expect(blurred).to.be.true

    it "can force blurring on a non-focused element", ->
      blurred = false

      cy.$$("input:first").blur ->
        blurred = true

      cy
        .get("input:last").focus()
        .get("input:first").blur({force: true})
        .then ->
          expect(blurred).to.be.true

    it "can force blurring when there is no focused element", ->
      blurred = false

      cy.$$("input:first").blur ->
        blurred = true

      cy
        .focused().should("not.exist")
        .get("input:first").blur({force: true})
        .then ->
          expect(blurred).to.be.true

    it "can focus svg elements", ->
      onBlur = cy.stub()

      cy.$$("[data-cy=rect]").blur(onBlur)

      cy.get("[data-cy=rect]").focus().blur().then ->
        expect(onBlur).to.be.calledOnce

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.$$(":text:first").blur ->
          _.delay =>
            $(@).addClass("blured")
          , 100

        cy.get(":text:first").focus().blur().should("have.class", "blured").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "blur"
            @lastLog = log
            @logs.push(log)

        return null

      it "logs immediately before resolving", ->
        input = cy.$$(":text:first")

        expected = false

        cy.on "log:added", (attrs, log) ->
          if log.get("name") is "blur"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq input.get(0)
            expected = true

        cy.get(":text:first").focus().blur().then ->
          expect(expected).to.be.true

      it "snapshots after clicking", ->
        cy.get(":text:first").focus().blur().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "passes in $el", ->
        cy.get("input:first").focus().blur().then ($input) ->
          lastLog = @lastLog

          expect(lastLog.get("$el")).to.eq $input

      it "logs 1 blur event", ->
        cy
          .get("input:first").focus().blur().then ->
            expect(@logs.length).to.eq(1)

      it "logs delta options for {force: true}", ->
        cy
          .get("input:first").blur({force: true}).then ->
            lastLog = @lastLog

            expect(lastLog.get("message")).to.eq("{force: true}")

      it "#consoleProps", ->
        cy.get("input:first").focus().blur().then ($input) ->
          expect(@lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "blur"
            "Applied To": $input.get(0)
          }

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when not a dom subject", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.blur()` failed because it requires a DOM element"
          done()

        cy.noop({}).blur()

      it "throws when subject is not in the document", (done) ->
        blurred = 0

        $input = cy.$$("input:first").blur (e) ->
          blurred += 1
          $input.focus ->
            $input.remove()
            return false
          return false

        cy.on "fail", (err) ->
          expect(blurred).to.eq 1
          expect(err.message).to.include "`cy.blur()` failed because this element"
          expect(err.docsUrl).to.include "https://on.cypress.io/element-has-detached-from-dom"
          done()

        cy.get("input:first").focus().blur().focus().blur()

      it "throws when subject is a collection of elements", (done) ->
        num = cy.$$("textarea,:text").length

        cy.on "fail", (err) =>
          expect(err.message).to.include("`cy.blur()` can only be called on a single element. Your subject contained #{num} elements.")
          expect(err.docsUrl).to.include("https://on.cypress.io/blur")
          done()

        cy.get("textarea,:text").blur()

      it "throws when there isnt an activeElement", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.blur()` can only be called when there is a currently focused element."
          expect(err.docsUrl).to.include("https://on.cypress.io/blur")
          done()

        cy.get("form:first").blur()

      it "throws when blur is called on a non-active element", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.include "`cy.blur()` can only be called on the focused element. Currently the focused element is a: `<input id=\"input\">`"
          expect(err.docsUrl).to.include("https://on.cypress.io/blur")
          done()

        cy.get("input:first").focus()
        cy.get("#button").blur()

      it "logs delta options on error", (done) ->
        cy.$$("button:first").click ->
          $(@).remove()

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq("{force: true}")
          done()

        cy.get("button:first").click().blur({force: true})

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.blur()

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get(":text:first").focus().blur().should("have.class", "blured")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(4)
          done()

        cy.get(":text:first").focus().blur().should("have.class", "blured")

      it "can handle window w/length > 1 as a subject", ->
        cy.window().should('have.length', 2)
        .focus()
