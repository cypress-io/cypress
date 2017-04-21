describe "$Cypress.EnvironmentVariables API", ->

  beforeEach ->
    @Cypress = $Cypress.create()

  it ".create", ->
    $Cypress.EnvironmentVariables.create(@Cypress)
    expect(@Cypress.environmentVariables).to.be.instanceof $Cypress.EnvironmentVariables

  describe "#constructor", ->
    it "sets .env", ->
      @env = new $Cypress.EnvironmentVariables
      expect(@env.env).to.deep.eq({})

    it "merges config into .env", ->
      @env = new $Cypress.EnvironmentVariables({foo: "bar"})
      expect(@env.env).to.deep.eq({foo: "bar"})

  describe "#get", ->
    beforeEach ->
      @env = new $Cypress.EnvironmentVariables({foo: "bar"})

    it "returns env", ->
      obj = {name: "b"}
      @env.env = obj
      expect(@env.get()).to.eq obj

  describe "#set", ->
    beforeEach ->
      @env = new $Cypress.EnvironmentVariables({foo: "bar"})

    it "sets with key, value", ->
      @env.set("bar", "baz")
      expect(@env.get()).to.deep.eq({foo: "bar", bar: "baz"})

    it "sets with object", ->
      @env.set({foo: "quux", bar: "baz"})
      expect(@env.get()).to.deep.eq({foo: "quux", bar: "baz"})

  describe "#getOrSet", ->
    beforeEach ->
      @env = new $Cypress.EnvironmentVariables({foo: "bar"})

    it "gets with no args", ->
      expect(@env.getOrSet()).to.deep.eq({foo: "bar"})

    it "gets with 1 string arg", ->
      expect(@env.getOrSet("foo")).to.eq("bar")

    it "sets with 1 object arg", ->
      @env.getOrSet({bar: "baz"})
      expect(@env.get()).to.deep.eq({foo: "bar", bar: "baz"})

    it "sets with 2 args", ->
      @env.getOrSet("bar", "baz")
      expect(@env.get()).to.deep.eq({foo: "bar", bar: "baz"})
