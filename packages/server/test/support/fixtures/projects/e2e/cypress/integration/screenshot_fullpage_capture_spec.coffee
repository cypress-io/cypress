{ devicePixelRatio } = window

it "takes consistent fullPage captures", ->
  options = { capture: "fullPage", blackout: [".black-me-out"] }

  cy
    .viewport(600, 200)
    .visit('http://localhost:3322/fullPage')
    .screenshot("fullPage-original", options)
    .then ->
      ## take 10 screenshots and check that they're all the same
      ## to ensure fullPage screenshots are consistent
      fn = (index) ->
        cy.screenshot("fullPage-compare", options)
        cy.task("compare:screenshots", { a: 'fullPage-original', b: 'fullPage-compare', blackout: true, devicePixelRatio })

      Cypress._.times(10, fn)

      return
