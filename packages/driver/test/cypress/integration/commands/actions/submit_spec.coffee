$ = Cypress.$.bind(Cypress)
_ = Cypress._
Promise = Cypress.Promise

describe "src/cy/commands/actions/submit", ->
  before ->
    cy
      .visit("/fixtures/dom.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    doc = cy.state("document")

    $(doc.body).empty().html(@body)

  context "#submit", ->
    it "does not change the subject when default actions is prevented", ->
      form = cy.$$("form:first").on "submit", -> return false

      cy.get("form:first").submit().then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "works with native event listeners", ->
      submitted = false

      cy.$$("form:first").get(0).addEventListener "submit", ->
        submitted = true

      cy.get("form:first").submit().then ->
        expect(submitted).to.be.true

    it "bubbles up to the window", ->
      onsubmitCalled = false

      cy
        .window().then (win) ->
          win.onsubmit = -> onsubmitCalled = true
          # $(win).on "submit", -> done()
        .get("form:first").submit().then ->
          expect(onsubmitCalled).to.be.true

    it "does not submit the form action is prevented default", (done) ->
      cy.$$("form:first").parent().on "submit", (e) ->
        e.preventDefault()

      cy
        .window()
        .then (win) =>
          $win = $(win)
          ## if we reach beforeunload we know the form
          ## has been submitted

          $win.on "beforeunload", ->
            done(new Error("submit event should not submit the form."))

            return undefined

          cy.get("form:first").submit().then ->
            $win.off "beforeunload"

            done()

    it "does not submit the form action returned false", (done) ->
      cy.$$("form:first").parent().on "submit", (e) ->
        return false

      cy
        .window()
        .then (win) =>
          $win = $(win)
          ## if we reach beforeunload we know the form
          ## has been submitted

          $win.on "beforeunload", ->
            done("submit event should not submit the form.")

            return undefined

          cy.get("form:first").submit().then ->
            $win.off "beforeunload"

            done()

    it "actually submits the form.", ->
      beforeunload = false

      cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            beforeunload = true

            return undefined
        .get("form:first").submit().then ->
          expect(beforeunload).to.be.true

    ## if we removed our submit handler this would fail.
    it "fires 'form:submitted event'", ->
      $form = cy.$$("form:first")
      ## we must rely on isReady already being pending here
      ## because the submit method does not trigger beforeunload
      ## synchronously.

      submitted = false

      cy.on "form:submitted", (e) ->
        submitted = true
        expect(e.target).to.eq($form.get(0))

      cy.get("form:first").submit().then ->
        expect(submitted).to.be.true

    it "does not fire 'form:submitted' if default action is prevented", ->
      submitted = false

      cy.on "form:submitted", (e) ->
        submitted = true

      cy.$$("form:first").on "submit", (e) ->
        e.preventDefault()

      cy
        .get("form:first").submit().then ->
          expect(submitted).to.be.false

    it "delays 50ms before resolving", ->
      cy.$$("form:first").on "submit", (e) =>
        cy.spy(Promise, "delay")

      cy.get("form:first").submit().then ->
        expect(Promise.delay).to.be.calledWith(50, "submit")

    it "increases the timeout delta", ->
      cy.spy(cy, "timeout")

      cy.get("form:first").submit().then ->
        expect(cy.timeout).to.be.calledWith(50, true)

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.$$("form:first").submit ->
          _.delay =>
            $(@).addClass("submitted")
          , 100

          return false

        cy.get("form:first").submit().should("have.class", "submitted").then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "is a child command", (done) ->
        cy.on "fail", -> done()

        cy.submit()

      it "throws when non dom subject", (done) ->
        cy.on "fail", -> done()

        cy.noop({}).submit()

      it "throws when subject isnt a form", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          expect(err.message).to.include "`cy.submit()` can only be called on a `<form>`. Your subject contains a: `<input id=\"input\">`"
          expect(err.docsUrl).to.eq("https://on.cypress.io/submit")
          done()

        cy.get("input").submit()

      it "throws when subject is not in the document", (done) ->
        submitted = 0

        form = cy.$$("form:first").submit (e) ->
          submitted += 1
          form.remove()
          return false

        cy.on "fail", (err) ->
          expect(submitted).to.eq 1
          expect(err.message).to.include "`cy.submit()` failed because this element"
          done()

        cy.get("form:first").submit().submit()

      it "throws when subject is a collection of elements", (done) ->
        forms = cy.$$("form")

        ## make sure we have more than 1 form.
        expect(forms.length).to.be.gt(1)

        cy.on "fail", (err) =>
          expect(err.message).to.include "`cy.submit()` can only be called on a single `form`. Your subject contained #{forms.length} `form` elements."
          expect(err.docsUrl).to.eq("https://on.cypress.io/submit")
          done()

        cy.get("form").submit()

      it "logs once when not dom subject", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.submit()

      it "eventually fails the assertion", (done) ->
        cy.$$("form:first").submit -> return false

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.get("form:first").submit().should("have.class", "submitted")

      it "does not log an additional log on failure", (done) ->
        cy.$$("form:first").submit -> return false

        cy.on "fail", =>
          expect(@logs.length).to.eq(3)
          done()

        cy.get("form:first").submit().should("have.class", "submitted")

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "submit"
            @lastLog = log

        return null

      it "logs immediately before resolving", ->
        $form = cy.$$("form:first")

        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "submit"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq $form.get(0)

        cy.get("form:first").submit()

      it "provides $el", ->
        cy.$$("form:first").submit -> return false

        cy.get("form").first().submit().then ($form) ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq "submit"
          expect(lastLog.get("$el")).to.match $form

      it "snapshots before submitted", ->
        expected = false

        cy.$$("form:first").submit -> return false

        cy.$$("form").first().submit =>
          lastLog = @lastLog

          expected = true

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0].name).to.eq("before")
          expect(lastLog.get("snapshots")[0].body).to.be.an("object")

        cy.get("form").first().submit().then ->
          expect(expected).to.be.true

      it "snapshots after submitting", ->
        cy.$$("form:first").submit -> return false

        cy.get("form").first().submit().then ($form) ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(2)
          expect(lastLog.get("snapshots")[1].name).to.eq("after")
          expect(lastLog.get("snapshots")[1].body).to.be.an("object")

      it "#consoleProps", ->
        cy.$$("form:first").submit -> return false

        cy.get("form").first().submit().then ($form) ->
          lastLog = @lastLog

          expect(@lastLog.invoke("consoleProps")).to.deep.eq {
            Command: "submit"
            "Applied To": lastLog.get("$el").get(0)
            Elements: 1
          }
