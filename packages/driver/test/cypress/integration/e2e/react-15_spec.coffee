describe "react v15.6.0", ->
  it "correctly fires onChange events", ->
    cy
      .visit("/fixtures/react-15.html")
      .get("#react-container input").type("foo").blur()
      .window().its("onChangeEvents").should("eq", 3)
