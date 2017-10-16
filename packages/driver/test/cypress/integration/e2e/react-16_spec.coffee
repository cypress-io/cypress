describe "react v16.0.0", ->
  it "correctly fires onChange events", ->
    cy
      .visit("/fixtures/react-16.html")
      .get("#react-container input").type("foo").blur()
      .window().its("onChangeEvents").should("eq", 3)
