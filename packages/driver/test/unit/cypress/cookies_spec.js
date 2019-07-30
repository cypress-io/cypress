require("../../support/unit_spec_helper")

_ = require("lodash")
Promise = require("bluebird")
Cookies = require("js-cookie")
$Cookies = require("#{src}/cypress/cookies")

describe "src/cypress/cookies", ->
  beforeEach ->
    jsdom.reconfigure({url: "http://localhost:3500"})

    @Cookies = $Cookies.create("__cypress", "localhost")

    @setCookie = (key, value) ->
      Cookies.set key, value, {path: "/"}

  afterEach ->
    ## remove all cookies after each test
    _.each Cookies.get(), (value, key) ->
      Cookies.remove(key, {path: "/"})

  context "._set", ->
    it "sets cookie value", ->
      @Cookies._set("foo", "bar")
      expect(Cookies.get("foo")).to.eq("bar")

  ## TODO: fixme, something wrong
  ## with JSDOM and domain cookies
  context.skip ".setCy", ->
    it "sets cypress cookie value", ->
      @Cookies.setCy("foo", "bar")
      expect(@Cookies._get("__cypress.foo")).to.eq("bar")

  context "._get", ->
    it "gets cookie value", ->
      @Cookies._set("foo", "bar")
      expect(@Cookies._get("foo")).to.eq("bar")

  ## TODO: fixme, something wrong
  ## with JSDOM and domain cookies
  context.skip ".getCy", ->
    it "gets cypress cookie value", ->
      @Cookies.setCy("foo", "bar")
      expect(@Cookies.getCy("foo")).to.eq("bar")

  context ".preserveOnce", ->
    it "does not delete for one cycle", ->
      @Cookies.preserveOnce("foo")
      cookies = @Cookies.getClearableCookies([{name: "foo"}])

      expect(cookies).to.deep.eq([])
      cookies = @Cookies.getClearableCookies([{name: "foo"}])
      expect(cookies).to.deep.eq([{name: "foo"}])

    it "can preserve multiple keys", ->
      @Cookies.preserveOnce("foo", "bar")
      cookies = @Cookies.getClearableCookies([{name: "foo"}, {name: "bar"}])

      expect(cookies).to.deep.eq([])
      cookies = @Cookies.getClearableCookies([{name: "foo"}, {name: "bar"}])
      expect(cookies).to.deep.eq([{name: "foo"}, {name: "bar"}])

  context ".log", ->
    beforeEach ->
      @Cookies.debug(false)

      @sandbox.stub(console, "info")
      @sandbox.stub(console, "warn")

    it "is noop without debugging", ->
      expect(@Cookies.log()).to.be.undefined
      expect(console.info).not.to.be.called
      expect(console.warn).not.to.be.called

    it "warns when removed is true", ->
      @Cookies.debug()

      @Cookies.log("asdf", {}, true)

      expect(console.warn).to.be.calledWith("asdf", {})

    it "infos when removed is false", ->
      @Cookies.debug()

      @Cookies.log("asdf", {}, false)

      expect(console.info).to.be.calledWith("asdf", {})

    it "does not log the cookie when verbose is false", ->
      @Cookies.debug(true, {verbose: false})

      @Cookies.log("asdf", {}, false)

      expect(console.info).to.be.calledWithExactly("asdf")

    it "does not log the cookie when false and verbose is true", ->
      @Cookies.debug(false, {verbose: true})

      @Cookies.log("asdf", {}, false)

      expect(console.info).not.to.be.called

  context ".defaults", ->
    afterEach ->
      @Cookies.defaults({
        whitelist: null
      })

    it "can whitelist by string", ->
      @Cookies.defaults({
        whitelist: "foo"
      })
      @Cookies._set("foo", "bar")
      cookies = @Cookies.getClearableCookies([{name: "foo"}])
      expect(cookies).to.deep.eq([])

    it "can whitelist by array", ->
      @Cookies.defaults({
        whitelist: ["foo", "baz"]
      })

      @Cookies._set("foo", "bar")
      @Cookies._set("baz", "quux")
      cookies = @Cookies.getClearableCookies([{name: "foo"}, {name: "baz"}])
      expect(cookies).to.deep.eq([])

    it "can whitelist by function", ->
      @Cookies.defaults({
        whitelist: (cookie) ->
          /__foo/.test cookie.name
      })

      @Cookies._set("__foo", "1")
      @Cookies._set("__foobar", "2")
      @Cookies._set("lol__foo", "3")
      cookies = @Cookies.getClearableCookies([{name: "__foo"}, {name: "__foobar"}, {name: "lol_foo"}])
      expect(cookies).to.deep.eq([{name: "lol_foo"}])

    it "can whitelist by regexp", ->
      @Cookies.defaults({
        whitelist: /bar/
      })

      @Cookies._set("bar", "1")
      @Cookies._set("foobarbaz", "2")
      @Cookies._set("baz", "3")
      cookies = @Cookies.getClearableCookies([{name: "bar"}, {name: "foobarbaz"}, {name: "baz"}])
      expect(cookies).to.deep.eq([{name: "baz"}])

  describe "removed methods", ->
    _.each ["set", "get", "remove", "getAllCookies", "clearCookies"], (method) ->
      it "throws invoking Cypress.Cookies.#{method}()", ->
        fn = =>
          @Cookies[method]()

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
