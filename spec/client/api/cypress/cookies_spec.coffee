describe "$Cypress.Cookies API", ->
  beforeEach ->
    @Cypress = $Cypress.create()

    @setCookie = (key, value) ->
      Cookies.set key, value, {path: "/"}

  afterEach ->
    ## remove all cookies after each test
    _.each Cookies.get(), (value, key) ->
      Cookies.remove(key, {path: "/"})

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
      @Cypress.Cookies.set "initial", true

      @Cypress.Cookies.clearCookies()
      expect(Cookies.get()).to.deep.eq {"__cypress.initial": "true"}

    it "does not clear cypress namespaced cookies even when key is provided", ->
      @setCookie "__cypress.initial", true
      @Cypress.Cookies.clearCookies("__cypress.initial")
      expect(Cookies.get()).to.deep.eq {"__cypress.initial": "true"}