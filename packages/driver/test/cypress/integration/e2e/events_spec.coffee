_ = Cypress._

describe "events", ->
  describe "page events", ->
    it "includes page details in page:start event", (done) ->
      cy.on "page:start", ({ win, url, statusCode, headers }) ->
        expect(win.Cypress).to.equal(Cypress)
        expect(url).to.equal("http://localhost:3500/fixtures/page-events.html")
        expect(statusCode).to.equal(200)
        expect(headers).to.be.an("object")
        expect(headers["access-control-allow-origin"]).to.be.equal("*")
        expect(headers["content-type"]).to.be.equal("text/html; charset=UTF-8")
        done()

      cy.visit("/fixtures/page-events.html")

    it "includes page details in page:ready event", (done) ->
      cy.on "page:ready", ({ win, url }) ->
        if /page\-events/.test(url)
          expect(win.Cypress).to.equal(Cypress)
          expect(win.__foo).to.equal("foo")
          expect(url).to.equal("http://localhost:3500/fixtures/page-events.html")
          done()

      cy.visit("/fixtures/page-events.html")

    it "includes page details in page:end event", (done) ->
      cy.on "page:end", ({ win, url }) ->
        if /page\-events/.test(url)
          expect(win.Cypress).to.equal(Cypress)
          expect(win.__foo).to.equal("foo")
          expect(url).to.equal("http://localhost:3500/fixtures/page-events.html")
          done()

      cy.visit("/fixtures/page-events.html")
      cy.get("#external-link").click()

  describe "window:* events", ->
    context "with cy.on", ->
      it "works before cy.visit", (done) ->
        cy.on "window:resize", (event) ->
          expect(event.type).to.equal("resize")
          done()

        cy.visit("/fixtures/page-events.html")
        cy.get("#resize").click()

      it "works after cy.visit", (done) ->
        cy.visit("/fixtures/page-events.html").then ->
          cy.on "window:resize", (event) ->
            expect(event.type).to.equal("resize")
            done()

          cy.get("#resize").click()

      describe "after page transitions", ->
        it "rebinds for listeners bound before cy.visit", (done) ->
          cy.on "window:resize", (event) ->
            expect(event.type).to.equal("resize")
            done()

          cy.visit("/fixtures/page-events.html")
          cy.get("#page-transition").click()
          cy.contains("h1", "Page Events 2")
          cy.get("#resize").click()

        it "rebinds for listeners bound after cy.visit", (done) ->
          cy.visit("/fixtures/page-events.html").then ->
            cy.on "window:resize", (event) ->
              expect(event.type).to.equal("resize")
              done()

          cy.get("#page-transition").click()
          cy.contains("h1", "Page Events 2")
          cy.get("#resize").click()

    context "with cy.off", ->
      it "unbinds the listener", ->
        onResize = (event) ->
          throw new Error("window:resize should not be called because it was unregistered with cy.off")
        cy.on("window:resize", onResize)
        cy.off("window:resize")

        cy.visit("/fixtures/page-events.html")
        cy.get("#resize").click()
        cy.wait(500) ## give it time to ensure onResize handler isn't called

    context "with Cypress.on", ->
      it "works before cy.visit", (done) ->
        onResize = (event) ->
          expect(event.type).to.equal("resize")
          Cypress.off("window:resize", onResize)
          done()
        Cypress.on("window:resize", onResize)

        cy.visit("/fixtures/page-events.html")
        cy.get("#resize").click()

      it "works after cy.visit", (done) ->
        cy.visit("/fixtures/page-events.html").then ->
          onResize = (event) ->
            expect(event.type).to.equal("resize")
            Cypress.off("window:resize", onResize)
            done()
          Cypress.on("window:resize", onResize)

          cy.get("#resize").click()

      describe "after page transitions", ->
        it "rebinds for listeners bound before cy.visit", (done) ->
          onResize = (event) ->
            expect(event.type).to.equal("resize")
            Cypress.off("window:resize", onResize)
            done()
          Cypress.on("window:resize", onResize)

          cy.visit("/fixtures/page-events.html")
          cy.get("#page-transition").click()
          cy.contains("h1", "Page Events 2")
          cy.get("#resize").click()

        it "rebinds for listeners bound after cy.visit", (done) ->
          cy.visit("/fixtures/page-events.html").then ->
            onResize = (event) ->
              expect(event.type).to.equal("resize")
              Cypress.off("window:resize", onResize)
              done()
            Cypress.on("window:resize", onResize)

          cy.get("#page-transition").click()
          cy.contains("h1", "Page Events 2")
          cy.get("#resize").click()

    context "with Cypress.off", ->
      it "unbinds the listener", ->
        onResize = (event) ->
          throw new Error("window:resize should not be called because it was unregistered with cy.off")
        Cypress.on("window:resize", onResize)
        Cypress.off("window:resize")

        cy.visit("/fixtures/page-events.html")
        cy.get("#resize").click()
        cy.wait(500) ## give it time to ensure onResize handler isn't called

  describe "renamed events", ->
    renamedEvents = {
      "command:end": "internal:commandEnd"
      "command:enqueued": "internal:commandEnqueued"
      "command:queue:before:end": "before:command:queue:end"
      "command:retry": "internal:commandRetry"
      "command:start": "internal:commandStart"
      "fail": "test:fail"
      "runnable:after:run:async": "after:runnable:run:async"
      "scrolled": "internal:scrolled"
      "test:after:run": "test:end"
      "test:before:run": "test:start"
      "test:before:run:async": "test:start:async"
      "url:changed": "page:url:changed"
      "viewport:changed": "viewport:change"
      "window:alert": "page:alert"
      "window:confirm": "page:confirm"
      "window:before:unload": "window:beforeunload"
    }

    renamedEventsWithArgumentChange = {
      "window:before:load": "page:start"
      "window:load": "page:ready"
    }

    methods = "addListener on once prependListener prependOnceListener".split(" ")

    _.each renamedEvents, (newEvent, oldEvent) ->
      _.each methods, (method) ->
        it "fails on use of cy.#{method}('#{oldEvent}')", (done) ->
          cy.on "test:fail", (err) =>
            expect(err.message).to.include("The '#{oldEvent}' event has been renamed to '#{newEvent}'")

            done()

          cy[method](oldEvent)
          cy.viewport(400, 400)

        it "fails on use of Cypress.#{method}('#{oldEvent}')", (done) ->
          cy.on "test:fail", (err) =>
            expect(err.message).to.include("The '#{oldEvent}' event has been renamed to '#{newEvent}'")

            done()

          Cypress[method](oldEvent)
          cy.viewport(400, 400)

    _.each renamedEventsWithArgumentChange, (newEvent, oldEvent) ->
      _.each methods, (method) ->
        it "fails on use of cy.#{method}('#{oldEvent}')", (done) ->
          cy.on "test:fail", (err) =>
            expect(err.message).to.include("The '#{oldEvent}' event has been renamed to '#{newEvent}' and its argument signature has been changed")
            expect(err.message).to.include("win // use of win argument")

            done()

          cy[method](oldEvent)
          cy.viewport(400, 400)

        it "fails on use of Cypress.#{method}('#{oldEvent}')", (done) ->
          cy.on "test:fail", (err) =>
            expect(err.message).to.include("The '#{oldEvent}' event has been renamed to '#{newEvent}' and its argument signature has been changed")
            expect(err.message).to.include("win // use of win argument")

            done()

          Cypress[method](oldEvent)
          cy.viewport(400, 400)
