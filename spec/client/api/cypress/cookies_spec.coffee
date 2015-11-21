describe "$Cypress.Cookies API", ->
  beforeEach ->
    @Cypress = $Cypress.create()

    @setCookie = (key, value) ->
      Cookies.set key, value, {path: "/"}

  afterEach ->
    ## remove all cookies after each test
    _.each Cookies.get(), (value, key) ->
      Cookies.remove(key, {path: "/"})

  context ".set", ->
    it "sets cookie value", ->
      @Cypress.Cookies.set("foo", "bar")
      expect(Cookies.get("foo")).to.eq("bar")

  context ".setCy", ->
    it "sets cypress cookie value", ->
      @Cypress.Cookies.setCy("foo", "bar")
      expect(Cookies.get("__cypress.foo")).to.eq("bar")

  context ".get", ->
    it "gets cookie value", ->
      @Cypress.Cookies.set("foo", "bar")
      expect(@Cypress.Cookies.get("foo")).to.eq("bar")

  context ".getCy", ->
    it "gets cypress cookie value", ->
      @Cypress.Cookies.setCy("foo", "bar")
      expect(@Cypress.Cookies.getCy("foo")).to.eq("bar")

  context ".preserveOnce", ->
    it "does not delete for one cycle", ->
      @Cypress.Cookies.set("foo", "bar")
      @Cypress.Cookies.preserveOnce("foo")
      @Cypress.Cookies.clearCookies()

      expect(@Cypress.Cookies.get("foo")).to.eq("bar")
      @Cypress.Cookies.clearCookies()
      expect(@Cypress.Cookies.get("foo")).to.be.undefined

    it "can preserve multiple keys", ->
      @Cypress.Cookies.set("foo", "bar")
      @Cypress.Cookies.set("baz", "quux")
      @Cypress.Cookies.preserveOnce("foo", "baz")
      @Cypress.Cookies.clearCookies()

      expect(@Cypress.Cookies.get("foo")).to.eq("bar")
      expect(@Cypress.Cookies.get("baz")).to.eq("quux")
      @Cypress.Cookies.clearCookies()
      expect(@Cypress.Cookies.get("foo")).to.be.undefined
      expect(@Cypress.Cookies.get("baz")).to.be.undefined

    it "can still forcibly remove cookies", ->
      @Cypress.Cookies.set("foo", "bar")
      @Cypress.Cookies.preserveOnce("foo")
      @Cypress.Cookies.remove("foo")
      expect(@Cypress.Cookies.get("foo")).to.be.undefined

  context ".getAllCookies", ->
    it "returns object of cookies", ->
      @setCookie("foo", "bar")
      cookies = @Cypress.Cookies.getAllCookies()
      expect(cookies).to.deep.eq {foo: "bar"}

    it "omits cypress namespaced cookies", ->
      @setCookie("foo", "bar")
      @setCookie("__cypress.foo", "cy.foo")
      cookies = @Cypress.Cookies.getAllCookies()
      expect(cookies).to.deep.eq {foo: "bar"}

  context ".clearCookies", ->
    it "can clear all", ->
      @setCookie("foo", "bar")
      @setCookie("baz", "quux")
      @Cypress.Cookies.clearCookies()
      cookies = @Cypress.Cookies.getAllCookies()
      expect(cookies).to.deep.eq {}

    it "can clear cookie by key", ->
      @setCookie("foo", "bar")
      @setCookie("baz", "quux")
      @Cypress.Cookies.clearCookies("foo")
      cookies = @Cypress.Cookies.getAllCookies()
      expect(cookies).to.deep.eq {baz: "quux"}

    it "does not clear cypress namespaced cookies", ->
      @setCookie("foo", "bar")
      @setCookie("baz", "quux")
      @Cypress.Cookies.setCy "initial", true

      @Cypress.Cookies.clearCookies()
      expect(Cookies.get()).to.deep.eq {"__cypress.initial": "true"}

    it "does not clear cypress namespaced cookies even when key is provided", ->
      @setCookie "__cypress.initial", true
      @Cypress.Cookies.clearCookies("__cypress.initial")
      expect(Cookies.get()).to.deep.eq {"__cypress.initial": "true"}

  context ".defaults", ->
    afterEach ->
      @Cypress.Cookies.defaults({
        whitelist: null
      })

    it "can whitelist by string", ->
      @Cypress.Cookies.defaults({
        whitelist: "foo"
      })
      @Cypress.Cookies.set("foo", "bar")
      @Cypress.Cookies.clearCookies()
      expect(@Cypress.Cookies.get("foo")).to.eq("bar")
      @Cypress.Cookies.remove("foo")
      expect(@Cypress.Cookies.get("foo")).to.be.undefined

    it "can whitelist by array", ->
      @Cypress.Cookies.defaults({
        whitelist: ["foo", "baz"]
      })

      @Cypress.Cookies.set("foo", "bar")
      @Cypress.Cookies.set("baz", "quux")
      @Cypress.Cookies.clearCookies()
      expect(@Cypress.Cookies.get("foo")).to.eq("bar")
      expect(@Cypress.Cookies.get("baz")).to.eq("quux")
      @Cypress.Cookies.remove("foo")
      @Cypress.Cookies.remove("baz")
      expect(@Cypress.Cookies.get("foo")).to.be.undefined
      expect(@Cypress.Cookies.get("baz")).to.be.undefined

    it "can whitelist by function", ->
      @Cypress.Cookies.defaults({
        whitelist: (name) ->
          /__foo/.test name
      })

      @Cypress.Cookies.set("__foo", "1")
      @Cypress.Cookies.set("__foobar", "2")
      @Cypress.Cookies.set("lol__foo", "3")
      @Cypress.Cookies.clearCookies()
      expect(@Cypress.Cookies.get("__foo")).to.eq("1")
      expect(@Cypress.Cookies.get("__foobar")).to.eq("2")
      expect(@Cypress.Cookies.get("lol_foo")).to.be.undefined
      @Cypress.Cookies.remove("__foo")
      @Cypress.Cookies.remove("__foobar")
      expect(@Cypress.Cookies.get("__foo")).to.be.undefined
      expect(@Cypress.Cookies.get("__foobar")).to.be.undefined

    it "can whitelist by regexp", ->
      @Cypress.Cookies.defaults({
        whitelist: /bar/
      })

      @Cypress.Cookies.set("bar", "1")
      @Cypress.Cookies.set("foobarbaz", "2")
      @Cypress.Cookies.set("baz", "3")
      @Cypress.Cookies.clearCookies()
      expect(@Cypress.Cookies.get("bar")).to.eq("1")
      expect(@Cypress.Cookies.get("foobarbaz")).to.eq("2")
      expect(@Cypress.Cookies.get("baz")).to.be.undefined
      @Cypress.Cookies.remove("bar")
      @Cypress.Cookies.remove("foobarbaz")
      expect(@Cypress.Cookies.get("bar")).to.be.undefined
      expect(@Cypress.Cookies.get("foobarbaz")).to.be.undefined