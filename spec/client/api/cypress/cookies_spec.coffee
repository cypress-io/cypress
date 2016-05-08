describe "$Cypress.Cookies API", ->
  beforeEach ->
    @Cypress = $Cypress.create()

    @setCookie = (key, value) ->
      Cookies.set key, value, {path: "/"}

  afterEach ->
    ## remove all cookies after each test
    _.each Cookies.get(), (value, key) ->
      Cookies.remove(key, {path: "/"})

  context "._set", ->
    it "sets cookie value", ->
      @Cypress.Cookies._set("foo", "bar")
      expect(Cookies.get("foo")).to.eq("bar")

  context ".setCy", ->
    it "sets cypress cookie value", ->
      @Cypress.Cookies.setCy("foo", "bar")
      expect(Cookies.get("__cypress.foo")).to.eq("bar")

  context "._get", ->
    it "gets cookie value", ->
      @Cypress.Cookies._set("foo", "bar")
      expect(@Cypress.Cookies._get("foo")).to.eq("bar")

  context ".getCy", ->
    it "gets cypress cookie value", ->
      @Cypress.Cookies.setCy("foo", "bar")
      expect(@Cypress.Cookies.getCy("foo")).to.eq("bar")

  context ".preserveOnce", ->
    it "does not delete for one cycle", ->
      @Cypress.Cookies.preserveOnce("foo")
      cookies = @Cypress.Cookies.getClearableCookies([{name: "foo"}])

      expect(cookies).to.deep.eq([])
      cookies = @Cypress.Cookies.getClearableCookies([{name: "foo"}])
      expect(cookies).to.deep.eq([{name: "foo"}])

    it "can preserve multiple keys", ->
      @Cypress.Cookies.preserveOnce("foo", "bar")
      cookies = @Cypress.Cookies.getClearableCookies([{name: "foo"}, {name: "bar"}])

      expect(cookies).to.deep.eq([])
      cookies = @Cypress.Cookies.getClearableCookies([{name: "foo"}, {name: "bar"}])
      expect(cookies).to.deep.eq([{name: "foo"}, {name: "bar"}])

  context ".defaults", ->
    afterEach ->
      @Cypress.Cookies.defaults({
        whitelist: null
      })

    it "can whitelist by string", ->
      @Cypress.Cookies.defaults({
        whitelist: "foo"
      })
      @Cypress.Cookies._set("foo", "bar")
      cookies = @Cypress.Cookies.getClearableCookies([{name: "foo"}])
      expect(cookies).to.deep.eq([])

    it "can whitelist by array", ->
      @Cypress.Cookies.defaults({
        whitelist: ["foo", "baz"]
      })

      @Cypress.Cookies._set("foo", "bar")
      @Cypress.Cookies._set("baz", "quux")
      cookies = @Cypress.Cookies.getClearableCookies([{name: "foo"}, {name: "baz"}])
      expect(cookies).to.deep.eq([])

    it "can whitelist by function", ->
      @Cypress.Cookies.defaults({
        whitelist: (cookie) ->
          /__foo/.test cookie.name
      })

      @Cypress.Cookies._set("__foo", "1")
      @Cypress.Cookies._set("__foobar", "2")
      @Cypress.Cookies._set("lol__foo", "3")
      cookies = @Cypress.Cookies.getClearableCookies([{name: "__foo"}, {name: "__foobar"}, {name: "lol_foo"}])
      expect(cookies).to.deep.eq([{name: "lol_foo"}])

    it "can whitelist by regexp", ->
      @Cypress.Cookies.defaults({
        whitelist: /bar/
      })

      @Cypress.Cookies._set("bar", "1")
      @Cypress.Cookies._set("foobarbaz", "2")
      @Cypress.Cookies._set("baz", "3")
      cookies = @Cypress.Cookies.getClearableCookies([{name: "bar"}, {name: "foobarbaz"}, {name: "baz"}])
      expect(cookies).to.deep.eq([{name: "baz"}])

  describe "removed methods", ->
    _.each ["set", "get", "remove", "getAllCookies", "clearCookies"], (method) ->
      it "throws invoking Cypress.Cookies.#{method}()", ->
        fn = =>
          @Cypress.Cookies[method]()

        expect(fn).to.throw """
        The Cypress.Cookies.#{method}() method has been removed.

        Setting, getting, and clearing cookies is now an asynchronous operation.

        Replace this call with the appropriate command such as:
          - cy.getCookie()
          - cy.getCookies()
          - cy.setCookie()
          - cy.clearCookie()
          - cy.clearCookies()

        """
