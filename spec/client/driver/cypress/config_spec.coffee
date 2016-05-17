describe "$Cypress.Config API", ->

  beforeEach ->
    @Cypress = $Cypress.create()

  it ".create", ->
    expect(@Cypress.config).to.be.undefined
    $Cypress.Config.create(@Cypress, {})
    expect(@Cypress.config).not.to.be.undefined

  describe "#config", ->
    beforeEach ->
      $Cypress.Config.create(@Cypress, {})

    it "sets by key/val", ->
      @Cypress.config("foo", "bar")
      expect(@Cypress.config("foo")).to.eq("bar")

    it "sets by object", ->
      @Cypress.config({foo: "bar"})
      expect(@Cypress.config("foo")).to.eq("bar")

    it "gets entire config", ->
      @Cypress.config({foo: "bar", bar: "baz"})
      expect(@Cypress.config()).to.deep.eq({foo: "bar", bar: "baz"})