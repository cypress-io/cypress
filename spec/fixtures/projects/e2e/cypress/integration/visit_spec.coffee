describe "visits", ->
  it "scrolls automatically to div with id=foo", ->
    cy
      .visit("/hash.html#foo")
      .window().its("scrollY").should("eq", 1000)