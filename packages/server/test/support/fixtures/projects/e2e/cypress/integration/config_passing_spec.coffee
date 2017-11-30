describe "Cypress.config()", ->
  it "has Cypress.version set to a string", ->
    expect(Cypress.version).to.be.a("string")

  it "has os platform", ->
    expect(Cypress.platform).to.be.a("string")
    expect(Cypress.platform).to.be.oneOf(["darwin", "linux", "win32"])

  it "has os architecture", ->
    expect(Cypress.arch).to.be.a("string")
