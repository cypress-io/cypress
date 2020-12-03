describe "base url", ->
  it "can visit", ->
    cy
      .visit("/html")
      .contains("Herman Melville")
