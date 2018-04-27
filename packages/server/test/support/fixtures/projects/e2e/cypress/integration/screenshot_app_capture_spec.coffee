describe "screenshot app capture", ->

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
          cy.task("compare:screenshots", { a: 'app-original', b: 'app-compare' })

        Cypress.Promise.map(Cypress._.times(50), fn, { concurrency: 1 })

  it "takes consistent fullpage captures", ->
    options = { capture: "fullpage", blackout: [".black-me-out"] }

    cy
      .viewport(600, 200)
      .visit('http://localhost:3322/fullpage')
      .screenshot("fullpage-original", options)
      .then ->
        ## take 10 screenshots and check that they're all the same
        ## to ensure fullpage screenshots are consistent
        fn = (index) ->
          cy.screenshot("fullpage-compare", options)
          cy.task("compare:screenshots", { a: 'fullpage-original', b: 'fullpage-compare' })

        Cypress.Promise.map(Cypress._.times(10), fn, { concurrency: 1 })
