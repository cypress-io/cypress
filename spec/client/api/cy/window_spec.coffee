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
        expect(viewport).to.deep.eq {viewportWidth: 800, viewportHeight: 600}
        done()

      @cy.viewport(800, 600)

    it "sets subject to null", ->
      @cy.viewport("ipad-2").then (subject) ->
        expect(subject).to.be.null

    it "sets viewportWidth and viewportHeight to private", (done) ->
      @Cypress.on "viewport", =>
        expect(@cy.private("viewportWidth")).to.eq(800)
        expect(@cy.private("viewportHeight")).to.eq(600)
        done()

      @cy.viewport(800, 600)

    context "presets", ->
      it "iphone-6", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {viewportWidth: 1334, viewportHeight: 750}
          done()

        @cy.viewport("iphone-6")

    context "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws with passed invalid preset", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport could not find a preset for: 'foo'. Available presets are: macbook-15, macbook-13, macbook-11, ipad-2, ipad-mini, ipad-mini-2, ipad-3, ipad-4, iphone-6+, iphone-6, iphone-5, iphone-4, iphone-3"
          done()

        @cy.viewport("foo")

      it "throws when passed a string as height", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport can only accept a string preset or a width and height as numbers."
          done()

        @cy.viewport(800, "600")

      it "throws when passed negative numbers", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport width and height must be between 200px and 3000px."
          done()

        @cy.viewport(800, -600)

      it "throws when passed width less than 200", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport width and height must be between 200px and 3000px."
          done()

        @cy.viewport(199, 600)

      it "throws when passed height greater than than 3000", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport width and height must be between 200px and 3000px."
          done()

        @cy.viewport(1000, 3001)

      it "throws when passed an empty string as width", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport cannot be passed an empty string."
          done()

        @cy.viewport("")

      _.each [{}, [], NaN, Infinity, null, undefined], (val) =>
        it "throws when passed the invalid: '#{val}' as width", (done) ->
          logs = []

          @Cypress.on "log", (log) ->
            logs.push(log)

          @cy.on "fail", (err) ->
            expect(logs.length).to.eq(1)
            expect(err.message).to.eq "cy.viewport can only accept a string preset or a width and height as numbers."
            done()

          @cy.viewport(val)

    context ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      afterEach ->
        @log = null

      it "logs viewport", ->
        @cy.viewport(800, 600).then ->
          expect(@log.get("name")).to.eq "viewport"

      it "logs viewport with width, height", ->
        @cy.viewport(800, 600).then ->
          expect(@log.get("message")).to.eq "800, 600"

      it "logs viewport with preset", ->
        @cy.viewport("ipad-2").then ->
          expect(@log.get("message")).to.eq "ipad-2"

      it "sets state to success immediately", ->
        @cy.viewport(800, 600).then ->
          expect(@log.get("state")).to.eq "success"

      it "snapshots immediately", ->
        @cy.viewport(800, 600).then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "can turn off logging viewport command", ->
        @cy.viewport(800, 600, {log: false}).then ->
          expect(@log).not.to.be.ok

      it "can turn off logging viewport when using preset", ->
        @cy.viewport("macbook-15", {log: false}).then ->
          expect(@log).not.to.be.ok

      it "sets viewportWidth and viewportHeight directly", ->
        @cy.viewport(800, 600).then ->
          expect(@log.get("viewportWidth")).to.eq(800)
          expect(@log.get("viewportHeight")).to.eq(600)

      it ".onConsole with preset", ->
        @cy.viewport("ipad-3").then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "viewport"
            Preset: "ipad-3"
            Width: 2048
            Height: 1536
          }

      it ".onConsole without preset", ->
        @cy.viewport(1024, 768).then ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "viewport"
            Width: 1024
            Height: 768
          }
