describe "$Cypress.Cy Window Commands", ->
  enterCommandTestingMode()

  context "#window", ->
    it "returns the remote window", ->
      @cy.window().then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

  context "#document", ->
    it "returns the remote document as a jquery object", ->
      @cy.document().then ($doc) ->
        expect($doc).to.eq $("iframe").prop("contentDocument")

    it "aliases doc to document", ->
      @cy.doc().then ($doc) ->
        expect($doc).to.eq $("iframe").prop("contentDocument")

  context "#title", ->
    it "returns the pages title as a string", ->
      title = @cy.$("title").text()
      @cy.title().then (text) ->
        expect(text).to.eq title

    it "retries finding the title", ->
      @cy.$("title").remove()

      retry = _.after 2, =>
        @cy.$("head").append $("<title>waiting on title</title>")

      @cy.on "retry", retry

      @cy.title().then (text) ->
        expect(text).to.eq "waiting on title"

    it "retries until it has the correct title", ->
      @cy.$("title").text("home page")

      retry = _.after 2, =>
        @cy.$("title").text("about page")

      @cy.on "retry", retry

      @cy.title().until (title) ->
        expect(title).to.eq "about page"

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(300)
        @allowErrors()

      it "throws after timing out", (done) ->
        @cy.$("title").remove()
        @cy.title()
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find element: title"
          done()

      it "only logs once", (done) ->
        @cy.$("title").remove()

        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.title()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>
          if @log.get("name") is "get"
            throw new Error("cy.get() should not have logged out.")

      it "logs immediately before resolving", (done) ->
        input = @cy.$(":text:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "title"
            expect(log.get("state")).to.eq("pending")
            done()

        @cy.title()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.title().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs obj", ->
        @cy.title().then ->
          obj = {
            name: "title"
            message: "DOM Fixture"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#onConsole", ->
        @cy.title().then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "title"
            Returned: "DOM Fixture"
          }

  context "#viewport", ->
    it "triggers 'viewport' event with dimensions object", (done) ->
      @Cypress.on "viewport", (viewport) ->
        expect(viewport).to.deep.eq {width: 800, height: 600}
        done()

      @cy.viewport(800, 600)

    context "presets", ->
      it "iphone-6", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {width: 1334, height: 750}
          done()

        @cy.viewport("iphone-6")

    context "errors", ->
      it "throws with passed invalid preset"

      it "throws when passed anything other than number or string"

    context ".log", ->
      it "logs viewport with width, height"

      it "sets state to success immediately"

      it "snapshots immediately"

      it "can turn off logging viewport command"

      it "can turn off logging viewport when using preset"
