_ = Cypress._

describe "events", ->
  describe "renamed events", ->
    renamedEvents = {
      "test:before:run": "test:run:start"
      "test:before:run:async": "test:run:start:async"
      "test:after:run": "after:test:run"
      "command:queue:before:end": "before:command:queue:end"
      "window:before:load": "page:start"
      "window:before:unload": "before:window:unload"
      "window:alert": "page:alert"
      "window:confirm": "page:confirm"
      "window:unload": "page:end"
      "runnable:after:run:async": "after:runnable:run:async"
      "scrolled": "internal:scrolled"
      "url:changed": "page:url:changed"
    }
    methods = "addListener on once prependListener prependOnceListener".split(" ")

    _.each renamedEvents, (newEvent, oldEvent) ->
      _.each methods, (method) ->
        it "fails on use of cy.#{method}('#{oldEvent}')", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include("The '#{oldEvent}' event has been renamed to '#{newEvent}'")

            done()

          cy[method](oldEvent)
          cy.viewport(400, 400)

        it "fails on use of Cypress.#{method}('#{oldEvent}')", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include("The '#{oldEvent}' event has been renamed to '#{newEvent}'")

            done()

          Cypress[method](oldEvent)
          cy.viewport(400, 400)
