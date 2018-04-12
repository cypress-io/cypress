describe "screenshot app capture", ->

  it "takes consistent app captures", ->
    options = { capture: ["app"], blackout: [".black-me-out"] }

    cy
      .visit('http://localhost:3322/')
      .screenshot("original", options)
      .then ->
        ## take 100 screenshots and check that they're all the same
        ## to ensure the Cypress UI is consistently hidden
        fn = ->
          cy.screenshot("compare", options)
          cy.task("compare:screenshots")

        Cypress.Promise.map(Cypress._.times(100), fn, { concurrency: 1 })
