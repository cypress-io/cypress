describe "screenshot app capture", ->

  it "takes consistent app captures", ->
    options = { capture: ["app"], blackout: [".black-me-out"] }

    cy
      .visit('http://localhost:3322/')
      .screenshot("original", options)
      .pause()
      .then ->
        ## take 100 screenshots and check that they're all the same
        ## to ensure the Cypress UI is consistently hidden
        screenshots = Cypress._.map Cypress._.times(100), -> ->
          cy.screenshot("compare", options)
          cy.task("compare:screenshots")

        Cypress.utils.runSerially(screenshots)
