{ $, _ } = window.testUtils

describe "$Cypress.Cy Window Commands", ->
  enterCommandTestingMode()

  context "#window", ->
    it "returns the remote window", ->
      @cy.window().then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

    describe "assertion verification", ->
      beforeEach ->
        @remoteWindow = @cy.privateState("window")

        delete @remoteWindow.foo

        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          @remoteWindow.foo = "bar"

        @cy.window().should("have.property", "foo", "bar").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "retry", _.after 2, =>
          @remoteWindow.foo = "foo"

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.window().should("have.property", "foo", "bar")

      it "can still fail on window", (done) ->
        win = @cy.privateState("window")

        @cy.privateState("window", undefined)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          @cy.privateState("window", win)

          @chai.restore()

          expect(logs.length).to.eq(1)
          expect(err.message).to.include(@log.get("error").message)
          expect(@log.get("name")).to.eq("window")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.window()

      it "does not log an additional log on failure", (done) ->
        @remoteWindow.foo = "foo"

        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.window().should("have.property", "foo", "bar")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "can turn off logging", ->
        @cy.window({log: false}).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (attrs, log) ->
          expect(log.get("state")).to.eq("pending")
          expect(log.get("snapshot")).not.to.be.ok
          done()

        @cy.window()

      it "snapshots after resolving", ->
        @cy.window().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "can be aliased", ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy
          .window().as("win")
          .get("body")
          .get("@win").then (win) ->
            expect(win).to.eq(@win)

            ## window + get + get
            expect(logs.length).to.eq(3)

            expect(logs[0].get("alias")).to.eq("win")
            expect(logs[0].get("aliasType")).to.eq("primitive")

            expect(logs[2].get("aliasType")).to.eq("primitive")
            expect(logs[2].get("referencesAlias")).to.eq("win")

      it "logs obj", ->
        @cy.window().then ->
          obj = {
            name: "window"
            message: ""
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#consoleProps", ->
        @cy.window().then (win) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "window"
            Yielded: win
          }

  context "#document", ->
    it "returns the remote document as a jquery object", ->
      @cy.document().then ($doc) ->
        expect($doc).to.eq $("iframe").prop("contentDocument")

    describe "assertion verification", ->
      beforeEach ->
        @remoteDocument = @cy.privateState("window").document

        delete @remoteDocument.foo

        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          @remoteDocument.foo = "bar"

        @cy.document().should("have.property", "foo", "bar").then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "retry", _.after 2, =>
          @remoteDocument.foo = "foo"

        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.document().should("have.property", "foo", "bar")

      it "can still fail on document", (done) ->
        win = @cy.privateState("window")

        @cy.privateState("window", undefined)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          @cy.privateState("window", win)

          @chai.restore()

          expect(logs.length).to.eq(1)
          expect(err.message).to.include(@log.get("error").message)
          expect(@log.get("name")).to.eq("document")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.document()

      it "does not log an additional log on failure", (done) ->
        @remoteDocument.foo = "foo"

        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.document().should("have.property", "foo", "bar")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "can turn off logging", ->
        @cy.document({log: false}).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (attrs, log) ->
          expect(log.get("state")).to.eq("pending")
          expect(log.get("snapshots")).not.to.be.ok
          done()

        @cy.document()

      it "snapshots after resolving", ->
        @cy.document().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "can be aliased", ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy
          .document().as("doc")
          .get("body")
          .get("@doc").then (doc) ->
            expect(doc).to.eq(@doc)

            ## docdow + get + get
            expect(logs.length).to.eq(3)

            expect(logs[0].get("alias")).to.eq("doc")
            expect(logs[0].get("aliasType")).to.eq("primitive")

            expect(logs[2].get("aliasType")).to.eq("primitive")
            expect(logs[2].get("referencesAlias")).to.eq("doc")

      it "logs obj", ->
        @cy.document().then ->
          obj = {
            name: "document"
            message: ""
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#consoleProps", ->
        @cy.document().then (win) ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "document"
            Yielded: win
          }

  context "#title", ->
    it "returns the pages title as a string", ->
      title = @cy.$$("title").text()
      @cy.title().then (text) ->
        expect(text).to.eq title

    it "retries finding the title", ->
      @cy.$$("title").remove()

      retry = _.after 2, =>
        @cy.$$("head").append $("<title>waiting on title</title>")

      @cy.on "retry", retry

      @cy.title().should("eq", "waiting on title")

    it "eventually resolves", ->
      _.delay ->
        @cy.$$("title").text("about page")
      , 100

      cy.title().should("eq", "about page").and("match", /about/)

    it "uses the first title element", ->
      title = @cy.$$("head title").text()

      @cy.$$("head").prepend("<title>some title</title>")
      @cy.$$("head").prepend("<title>another title</title>")

      @cy.title().then ($title) ->
        expect($title).to.eq("another title")

    it "uses document.title setter over <title>", ->
      title = @cy.$$("title")

      ## make sure we have a title element
      expect(title.length).to.eq(1)
      expect(title.text()).not.to.eq("foo")

      @cy.privateState("document").title = "foo"

      @cy.title().then (title) ->
        expect(title).to.eq("foo")

    it "is empty string when no <title>", ->
      @cy.$$("title").remove()

      @cy.title().then ($title) ->
        expect($title).to.eq("")

    describe "errors", ->
      beforeEach ->
        @currentTest.timeout(200)
        @allowErrors()

      it "throws after timing out", (done) ->
        @cy.$$("title").remove()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "expected '' to equal 'asdf'"
          done()

        @cy.title().should("eq", "asdf")

      it "only logs once", (done) ->
        @cy.$$("title").remove()

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.title().should("eq", "asdf")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>
          if @log.get("name") is "get"
            throw new Error("cy.get() should not have logged out.")

      it "can turn off logging", ->
        @cy.title({log: false}).then ->
          expect(@log).to.be.undefined

      it "logs immediately before resolving", (done) ->
        input = @cy.$$(":text:first")

        @Cypress.on "log", (attrs, log) ->
          if log.get("name") is "title"
            expect(log.get("state")).to.eq("pending")
            done()

        @cy.title()

      it "snapshots after clicking", ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.title().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "logs obj", ->
        @cy.title().then ->
          obj = {
            name: "title"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#consoleProps", ->
        @cy.title().then ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "title"
            Yielded: "DOM Fixture"
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
        expect(@Cypress.config("viewportWidth")).to.eq(800)
        expect(@Cypress.config("viewportHeight")).to.eq(600)
        done()

      @cy.viewport(800, 600)

    context "presets", ->
      it "ipad-2", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {viewportWidth: 768, viewportHeight: 1024}
          done()

        @cy.viewport("ipad-2")

      it "ipad-mini", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {viewportWidth: 768, viewportHeight: 1024}
          done()

        @cy.viewport("ipad-mini")

      it "iphone-6+", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {viewportWidth: 414, viewportHeight: 736}
          done()

        @cy.viewport("iphone-6+")

      it "iphone-6", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {viewportWidth: 375, viewportHeight: 667}
          done()

        @cy.viewport("iphone-6")

      it "iphone-5", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {viewportWidth: 320, viewportHeight: 568}
          done()

        @cy.viewport("iphone-5")

      it "can change the orientation to landspace", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {viewportWidth: 568, viewportHeight: 320}
          done()

        @cy.viewport("iphone-5", "landscape")

      it "can change the orientation to portrait", (done) ->
        @Cypress.on "viewport", (viewport) ->
          expect(viewport).to.deep.eq {viewportWidth: 320, viewportHeight: 568}
          done()

        @cy.viewport("iphone-5", "portrait")

    context "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws with passed invalid preset", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport() could not find a preset for: 'foo'. Available presets are: macbook-15, macbook-13, macbook-11, ipad-2, ipad-mini, iphone-6+, iphone-6, iphone-5, iphone-4, iphone-3"
          done()

        @cy.viewport("foo")

      it "throws when passed a string as height", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport() can only accept a string preset or a width and height as numbers."
          done()

        @cy.viewport(800, "600")

      it "throws when passed negative numbers", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport() width and height must be between 200px and 3000px."
          done()

        @cy.viewport(800, -600)

      it "throws when passed width less than 200", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport() width and height must be between 200px and 3000px."
          done()

        @cy.viewport(199, 600)

      it "does not throw when passed width equal to 200", ->
        @cy.viewport(200, 600)

      it "throws when passed height greater than than 3000", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport() width and height must be between 200px and 3000px."
          done()

        @cy.viewport(1000, 3001)

      it "does not throw when passed width equal to 3000", ->
        @cy.viewport(200, 3000)

      it "throws when passed an empty string as width", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport() cannot be passed an empty string."
          done()

        @cy.viewport("")

      it "throws when passed an invalid orientation on a preset", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          expect(err.message).to.eq "cy.viewport() can only accept 'landscape' or 'portrait' as valid orientations. Your orientation was: 'foobar'"
          done()

        @cy.viewport("iphone-4", "foobar")

      _.each [{}, [], NaN, Infinity, null, undefined], (val) =>
        it "throws when passed the invalid: '#{val}' as width", (done) ->
          logs = []

          @Cypress.on "log", (attrs, log) ->
            logs.push(log)

          @cy.on "fail", (err) ->
            expect(logs.length).to.eq(1)
            expect(err.message).to.eq "cy.viewport() can only accept a string preset or a width and height as numbers."
            done()

          @cy.viewport(val)

    context ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

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
          expect(@log.get("state")).to.eq "passed"

      it "snapshots immediately", ->
        @cy.viewport(800, 600).then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

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

      it ".consoleProps with preset", ->
        @cy.viewport("ipad-mini").then ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "viewport"
            Preset: "ipad-mini"
            Width: 768
            Height: 1024
          }

      it ".consoleProps without preset", ->
        @cy.viewport(1024, 768).then ->
          expect(@log.attributes.consoleProps()).to.deep.eq {
            Command: "viewport"
            Width: 1024
            Height: 768
          }
