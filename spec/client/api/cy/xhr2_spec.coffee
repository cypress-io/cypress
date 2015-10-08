describe "$Cypress.Cy XHR2 Commands", ->
  enterCommandTestingMode()

  it "logs all xhr requests", ->
    @cy
      .visit("fixtures/html/xhr.html")
      .window().then (win) ->
        win.$.get("/fixtures/html/dom.html").done (resp) ->
          debugger
