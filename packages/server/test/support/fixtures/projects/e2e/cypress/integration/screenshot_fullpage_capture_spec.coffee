it "takes consistent fullpage captures", ->
  options = { capture: "fullPage", blackout: [".black-me-out"] }

  cy
    .viewport(600, 200)
    .visit('http://localhost:3322/fullpage')
    .screenshot("fullpage-original", options)
    .then ->
      ## take 10 screenshots and check that they're all the same
      ## to ensure fullpage screenshots are consistent
      fn = (index) ->
        cy.screenshot("fullpage-compare", options)
        cy.task("compare:screenshots", { a: 'fullpage-original', b: 'fullpage-compare', blackout: true })

      Cypress.Promise.map(Cypress._.times(10), fn, { concurrency: 1 })
