{ $, _ } = window.testUtils

describe "$Cypress.Cy Form Commands", ->
  enterCommandTestingMode()

  context "#submit", ->
    it "does not change the subject when default actions is prevented", ->
      form = @cy.$$("form:first").on "submit", -> return false

      @cy.get("form:first").submit().then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "works with native event listeners", ->
      submitted = false

      @cy.$$("form:first").get(0).addEventListener "submit", ->
        submitted = true

      @cy.get("form:first").submit().then ->
        expect(submitted).to.be.true

    it "bubbles up to the window", ->
      onsubmitCalled = false

      @cy
        .window().then (win) ->
          win.onsubmit = -> onsubmitCalled = true
          # $(win).on "submit", -> done()
        .get("form:first").submit().then ->
          expect(onsubmitCalled).to.be.true

    it "does not submit the form action is prevented default", (done) ->
      @cy.$$("form:first").parent().on "submit", (e) ->
        e.preventDefault()

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            done("submit event should not submit the form.")

            return undefined
        .get("form:first").submit().then -> done()

    it "does not submit the form action returned false", (done) ->
      @cy.$$("form:first").parent().on "submit", (e) ->
        return false

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            done("submit event should not submit the form.")

            return undefined
        .get("form:first").submit().then -> done()

    it "actually submits the form.", ->
      beforeunload = false

      @cy
        .window().then (win) =>
          ## if we reach beforeunload we know the form
          ## has been submitted
          $(win).on "beforeunload", ->
            beforeunload = true

            return undefined
        .get("form:first").submit().then ->
          expect(beforeunload).to.be.true

    ## if we removed our submit handler this would fail.
    it "does not resolve the submit command because submit event is captured setting isReady to false", ->
      ## we must rely on isReady already being pending here
      ## because the submit method does not trigger beforeunload
      ## synchronously.

      @cy.on "command:returned:value", (cmd, ret) =>
        if cmd.get("name") is "submit"
          ## expect our isReady to be pending
          expect(@cy.state("ready").promise.isPending()).to.be.true

      @cy.get("form:first").submit()

    it "delays 50ms before resolving", (done) ->
      waited = false

      @cy.$$("form:first").on "submit", (e) =>
        _.delay ->
          waited = true
        , 50

        @cy.on "invoke:end", ->
          expect(waited).to.be.true
          done()

      @cy.get("form:first").submit()

    it "increases the timeout delta", (done) ->
      prevTimeout = @test.timeout()

      @cy.on "invoke:end", (cmd) =>
        if cmd.get("name") is "submit"
          expect(@test.timeout()).to.eq 50 + prevTimeout
          done()

      @cy.get("form:first").submit()

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "fail", (err) -> debugger

        @cy.$$("form:first").submit ->
          _.delay =>
            $(@).addClass("submitted")
          , 100

          return false

        @cy.get("form:first").submit().should("have.class", "submitted").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.$$("form:first").submit -> return false

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.get("form:first").submit().should("have.class", "submitted")

      it "does not log an additional log on failure", (done) ->
        @cy.$$("form:first").submit -> return false

        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(3)
          done()

        @cy.get("form:first").submit().should("have.class", "submitted")

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "is a child command", (done) ->
        @cy.on "fail", -> done()

        @cy.submit()

      it "throws when non dom subject", (done) ->
        @cy.on "fail", -> done()

        @cy.noop({}).submit()

      it "throws when subject isnt a form", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          expect(err.message).to.include "cy.submit() can only be called on a <form>. Your subject contains a: <input id=\"input\">"
          done()

        @cy.get("input").submit()

      it "throws when subject is not in the document", (done) ->
        submitted = 0

        form = @cy.$$("form:first").submit (e) ->
          submitted += 1
          form.remove()
          return false

        @cy.on "fail", (err) ->
          expect(submitted).to.eq 1
          expect(err.message).to.include "cy.submit() failed because this element"
          done()

        @cy.get("form:first").submit().submit()

      it "throws when subject is a collection of elements", (done) ->
        forms = @cy.$$("form")

        ## make sure we have more than 1 form.
        expect(forms.length).to.be.gt(1)

        @cy.on "fail", (err) =>
          expect(err.message).to.include "cy.submit() can only be called on a single form. Your subject contained #{forms.length} form elements."
          done()

        @cy.get("form").submit()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.submit()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "submit"
            @log = log

      it "logs immediately before resolving", ->
        form = @cy.$$("form:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "submit"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("$el").get(0)).to.eq form.get(0)

        @cy.get("form:first").submit()

      it "provides $el", ->
        @cy.$$("form:first").submit -> return false

        @cy.get("form").first().submit().then ($form) ->
          expect(@log.get("name")).to.eq "submit"
          expect(@log.get("$el")).to.match $form

      it "snapshots before submitted", (done) ->
        @cy.$$("form:first").submit -> return false

        @cy.$$("form").first().submit =>
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0].name).to.eq("before")
          expect(@log.get("snapshots")[0].body).to.be.an("object")
          done()

        @cy.get("form").first().submit()

      it "snapshots after submitting", ->
        @cy.$$("form:first").submit -> return false

        @cy.get("form").first().submit().then ($form) ->
          expect(@log.get("snapshots").length).to.eq(2)
          expect(@log.get("snapshots")[1].name).to.eq("after")
          expect(@log.get("snapshots")[1].body).to.be.an("object")

      it "#consoleProps", ->
        @cy.$$("form:first").submit -> return false

        @cy.get("form").first().submit().then ($form) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "submit"
            "Applied To": @log.get("$el").get(0)
            Elements: 1
          }
