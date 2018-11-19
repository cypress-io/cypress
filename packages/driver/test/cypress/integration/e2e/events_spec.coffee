_ = Cypress._

describe "events", ->
  describe "renamed events", ->
    renamedEvents = {
      "command:queue:before:end": "before:command:queue:end"
      "fail": "test:fail"
      "runnable:after:run:async": "after:runnable:run:async"
      "scrolled": "internal:scrolled"
      "test:after:run": "test:run:end"
      "test:before:run": "test:run:start"
      "test:before:run:async": "test:run:start:async"
      "url:changed": "page:url:changed"
      "window:alert": "page:alert"
      "window:before:load": "page:start"
      "window:before:unload": "before:window:unload"
      "window:confirm": "page:confirm"
      "window:unload": "page:end"
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
