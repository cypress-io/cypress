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
      "window:before:unload": "before:window:unload"
      "window:confirm": "page:confirm"
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
