context "react.js", ->
  enterCommandTestingMode("react", {replaceIframeContents: false})

  describe "change events in  v15.6.0", ->
    it "correctly fires onChange events", ->
      cy
        .get("#react-container input").type("foo").blur()
        .window().its("onChangeEvents").should("eq", 3)
