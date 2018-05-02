it "takes consistent app captures", ->
  options = { blackout: [".black-me-out"] }

  cy
    .visit('http://localhost:3322/app')
    .screenshot("app-original", options)
    .then ->
      ## take 50 screenshots and check that they're all the same
      ## to ensure the Cypress UI is consistently hidden
      fn = ->
        cy.screenshot("app-compare", options)
        cy.task("compare:screenshots", { a: 'app-original', b: 'app-compare', blackout: true })

      Cypress.Promise.map(Cypress._.times(50), fn, { concurrency: 1 })
