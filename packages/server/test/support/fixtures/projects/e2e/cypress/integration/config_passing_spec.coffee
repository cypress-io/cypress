describe "Cypress static methods + props", ->
  it ".version", ->
    expect(Cypress.version).to.be.a("string")

  it ".platform", ->
    expect(Cypress.platform).to.be.a("string")
    expect(Cypress.platform).to.be.oneOf(["darwin", "linux", "win32"])

  it ".arch", ->
    expect(Cypress.arch).to.be.a("string")

  it ".browser", ->
    { browser } = Cypress

    expect(browser).to.be.an("object")
    expect(browser.name).to.be.oneOf(["electron", "chrome", "canary", "chromium"])
    expect(browser.displayName).to.be.oneOf(["Electron", "Chrome", "Canary", "Chromium"])
    expect(browser.version).to.be.a("string")
    expect(browser.majorVersion).to.be.a("string")
    expect(browser.path).to.be.a("string")
    
    switch browser.isHeadless
      when true
        expect(browser.isHeaded).to.be.false
      when false
        expect(browser.isHeaded).to.be.true
      else
        expect(browser.isHeadless, "browser.isHeadless").not.to.be.undefined

  it ".spec", ->
    { spec } = Cypress

    expect(spec).to.be.an("object")
    expect(spec.name).to.eq("config_passing_spec.coffee")
    expect(spec.relative).to.eq("cypress/integration/config_passing_spec.coffee")
    expect(spec.absolute.indexOf("cypress/integration/config_passing_spec.coffee")).to.be.gt(0)
