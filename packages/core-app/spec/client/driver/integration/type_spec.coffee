describe "Type Integration Tests", ->
  context "html/type", ->
    enterCommandTestingMode("html/type")

    describe "card.js", ->
      it "it correctly changes the caret position and value of card expiration", ->
        @cy
          .window().then (win) ->
            win.$("form").card({
              container: "#card-container"
            })
          .get("[name='expiry']")
            .type("0314")
            .should("have.value", "03 / 14")