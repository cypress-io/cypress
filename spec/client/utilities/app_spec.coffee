describe "App", ->
  context "before:start", ->
    it "calls clearCookies with options.namespace", ->
      clearAllCookies = @sandbox.spy App, "clearAllCookies"
      App.trigger("before:start", {namespace: "foo"})
      expect(clearAllCookies).to.be.called