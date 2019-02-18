it "overrides config", ->
  ## overrides come from background file
  expect(Cypress.config("defaultCommandTimeout")).to.eq(500)
  expect(Cypress.config("videoCompression")).to.eq(20)

  ## overrides come from CLI
  expect(Cypress.config("pageLoadTimeout")).to.eq(10000)

it "overrides env", ->
  ## overrides come from background file
  expect(Cypress.env("foo")).to.eq("bar")

  ## overrides come from CLI
  expect(Cypress.env("bar")).to.eq("bar")
