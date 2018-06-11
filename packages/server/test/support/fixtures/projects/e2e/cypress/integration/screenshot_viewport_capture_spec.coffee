{ devicePixelRatio } = window

it "takes consistent viewport captures", ->
  options = { capture: "viewport", blackout: [".black-me-out"] }

  cy
    .visit("http://localhost:3322/viewport")
    .screenshot("viewport-original", options)
    .then ->
      ## take 25 screenshots and check that they're all the same
      ## to ensure the Cypress UI is consistently hidden
      fn = ->
        cy.screenshot("viewport-compare", options)
        cy.task("compare:screenshots", {
          a: "screenshot_viewport_capture_spec.coffee/viewport-original", 
          b: "screenshot_viewport_capture_spec.coffee/viewport-compare",
          blackout: true,
          devicePixelRatio
        })

      Cypress._.times(25, fn)

      return
