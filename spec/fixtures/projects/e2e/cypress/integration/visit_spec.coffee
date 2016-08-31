describe "visits", ->
  it "scrolls automatically to div with id=foo", ->
    cy
      .visit("/hash.html#foo")
      .window().its("scrollY").should("eq", 1000)

  it "can load an http page with a huge amount of elements without timing out", ->
    cy.visit("http://localhost:3434/elements.html", {timeout: 5000})

  it "can load a local file with a huge amount of elements without timing out", ->
    cy.visit("/elements.html", {timeout: 5000})