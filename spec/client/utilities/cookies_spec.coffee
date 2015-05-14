describe "Cookies", ->
  context "clearAllCookiesBeforeUnload", ->
    it "calls App.clearAllCookies with namespace", ->
      clearAllCookies = @sandbox.spy App, "clearAllCookies"
      App.clearAllCookiesBeforeUnload()
      $(window).trigger "beforeunload"
      expect(clearAllCookies).to.be.called

  context "clearAllCookies", ->
    beforeEach ->
      Cookies.set("__cypress.initial", true, {path: "/"})
      Cookies.set("__cypress.remoteHost", "http://localhost:8080/", {path: "/"})

    it "clears cypress namespaced cookies", ->
      App.clearAllCookies("__cypress")
      expect(Cookies.get("__cypress.initial")).to.be.undefined
      expect(Cookies.get("__cypress.remoteHost")).to.be.undefined

    # it "does not clear cookies which do not match namespace", ->
    #   Cookies.set("sessionId", "12345")
    #   App.clearAllCookies("__cypress")
    #   expect(Cookies.get("sessionId")).to.eq "12345"
    #   expect(Cookies.get()).to.have.keys("sessionId")
    #   Cookies.remove("sessionId")