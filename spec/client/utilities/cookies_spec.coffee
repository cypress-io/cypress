describe "Cookies", ->
  context "clearAllCookiesBeforeUnload", ->
    it "calls App.clearAllCookies with namespace", ->
      clearAllCookies = @sandbox.spy App, "clearAllCookies"
      App.clearAllCookiesBeforeUnload()
      $(window).trigger "beforeunload"
      expect(clearAllCookies).to.be.called
      expect(Cookies.get("__cypress.unload")).to.eq("true")

  context "clearAllCookies", ->
    beforeEach ->
      Cookies.set("__cypress.initial", true, {path: "/"})
      Cookies.set("__cypress.remoteHost", "http://localhost:8080/", {path: "/"})
      Cookies.set("foo", "bar", {path: "/"})

    it "clears cypress namespaced cookies", ->
      App.clearAllCookies()
      expect(Cookies.get("__cypress.initial")).to.be.undefined
      expect(Cookies.get("__cypress.remoteHost")).to.be.undefined
      expect(Cookies.get("foo")).to.eq("bar")