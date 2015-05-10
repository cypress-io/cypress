describe "Cookies", ->
  context "clearCookiesBeforeUnload", ->
    it "calls App.clearCookies with namespace", ->
      clearCookies = @sandbox.spy App, "clearCookies"
      App.clearCookiesBeforeUnload("foo")
      $(window).trigger "beforeunload"
      expect(clearCookies).to.be.calledWith "foo"

  context "clearCookies", ->
    beforeEach ->
      Cookies.set("__cypress.initial", true, {path: "/"})
      Cookies.set("__cypress.remoteHost", "http://localhost:8080/", {path: "/"})

    it "clears cypress namespaced cookies", ->
      App.clearCookies("__cypress")
      expect(Cookies.get("__cypress.initial")).to.be.undefined
      expect(Cookies.get("__cypress.remoteHost")).to.be.undefined

    it "does not clear cookies which do not match namespace", ->
      Cookies.set("sessionId", "12345")
      App.clearCookies("__cypress")
      expect(Cookies.get("sessionId")).to.eq "12345"
      expect(Cookies.get()).to.have.keys("sessionId")
      Cookies.remove("sessionId")