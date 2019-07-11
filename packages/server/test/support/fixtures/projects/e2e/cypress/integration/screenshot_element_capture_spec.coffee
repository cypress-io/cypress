{ devicePixelRatio } = window

it "takes consistent element captures", ->
  cy
    .viewport(600, 200)
    .visit("http://localhost:3322/element")
    .get(".capture-me")
    .screenshot("element-original")
    .then ->
      ## take 10 screenshots and check that they're all the same
      ## to ensure element screenshots are consistent
      fn = (index) ->
        cy.get(".capture-me").screenshot("element-compare")
        cy.task("compare:screenshots", { 
          a: "screenshot_element_capture_spec.coffee/element-original",
          b: "screenshot_element_capture_spec.coffee/element-compare", devicePixelRatio 
        })

      Cypress._.times(10, fn)

      return
