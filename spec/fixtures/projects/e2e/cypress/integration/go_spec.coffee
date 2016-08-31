describe "cy.go", ->
  ## this first test is failing in electron 1.2.8
  ## and in electron 1.3.x
  it.skip "can move between pages correctly", ->
    cy
      .visit("http://localhost:1818/first")
      .get("h1").should("contain", "first")
      .get("a").click()
      .url().should("match", /second/)
      .get("h1").should("contain", "second")
      .go("back")
      .url().should("match", /first/)
      .get("h1").should("contain", "first")
      .go("forward")
      .url().should("match", /second/)
      .get("h1").should("contain", "second")

  ## this test is actually failing and we need to update
  ## the driver not to visit about:blank between visits
  ## since cy.go() navigates back to about:blank
  it.skip "can visit two urls and go back and forward", ->
    cy
      .visit("http://localhost:1818/first").contains("first")
      .visit("http://localhost:1818/second").contains("second")
      .go("back").contains("first")
      .go("forward").contains("second")