_ = Cypress._

addBrowserProps = require("../../../../src/cypress/browser")

describe "src/cypress/browser", ->
  beforeEach ->
    @commands = (browser = { name: "chrome" }) ->
      Cypress = {}
      addBrowserProps(Cypress, { browser })
      return Cypress

  context ".browser", ->
    it "returns the current browser", ->
      expect(@commands().browser).to.eql({ name: "chrome" })

  context ".isBrowser", ->
    it "returns true if it's a match", ->
      expect(@commands().isBrowser("chrome")).to.be.true

    it "returns false if it's not a match", ->
      expect(@commands().isBrowser("firefox")).to.be.false

    it "is case-insensitive", ->
      expect(@commands().isBrowser("Chrome")).to.be.true

  context ".isBrowserType", ->
    it "returns true if it's a match or a 'parent' browser", ->
      expect(@commands().isBrowserType("chrome")).to.be.true
      expect(@commands({ name: "electron" }).isBrowserType("chrome")).to.be.true
      expect(@commands({ name: "chromium" }).isBrowserType("chrome")).to.be.true
      expect(@commands({ name: "canary" }).isBrowserType("chrome")).to.be.true
      expect(@commands({ name: "firefox" }).isBrowserType("firefox")).to.be.true

    it "returns false if it's not a match", ->
      expect(@commands().isBrowser("firefox")).to.be.false
      expect(@commands({ name: "firefox" }).isBrowser("chrome")).to.be.false

    it "is case-insensitive", ->
      expect(@commands().isBrowserType("Chrome")).to.be.true
      expect(@commands({ name: "Firefox" }).isBrowserType("fireFox")).to.be.true
