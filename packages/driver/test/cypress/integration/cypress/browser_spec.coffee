_ = Cypress._

browserProps = require("../../../../src/cypress/browser")

describe "src/cypress/browser", ->
  beforeEach ->
    @commands = (browser = { name: "chrome", family: "chromium" }) ->
      browserProps({ browser })

  context ".browser", ->
    it "returns the current browser", ->
      expect(@commands().browser).to.eql({ name: "chrome", family: "chromium" })

  context ".isBrowser", ->
    it "returns true if it's a match", ->
      expect(@commands().isBrowser("chrome")).to.be.true
      expect(@commands().isBrowser({ family: 'chromium' })).to.be.true

    it "returns false if it's not a match", ->
      expect(@commands().isBrowser("firefox")).to.be.false

    it "is case-insensitive", ->
      expect(@commands().isBrowser("Chrome")).to.be.true

    it "throws if arg is not a string or object", ->
      expect =>
        @commands().isBrowser(true)
      .to.throw("`Cypress.isBrowser()` must be passed the name of a browser or an object to filter with. You passed: `true`")

    it "returns true if it's a match or a 'parent' browser", ->
      expect(@commands().isBrowser("chrome")).to.be.true
      expect(@commands({ name: "electron" }).isBrowser("chrome")).to.be.false
      expect(@commands({ name: "chromium" }).isBrowser("chrome")).to.be.false
      expect(@commands({ name: "canary" }).isBrowser("chrome")).to.be.false
      expect(@commands({ name: "firefox" }).isBrowser("firefox")).to.be.true
      expect(@commands({ name: "ie" }).isBrowser("ie")).to.be.true

    it "matches on name if has unknown family", ->
      expect(@commands({ name: 'customFoo'}).isBrowser("customfoo")).to.be.true
