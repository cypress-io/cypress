describe "Clicks Integration Tests", ->
  enterCommandTestingMode("html/clicks")

  context "clicking edge cases", ->
    it "can click inputs under a fixed-position nav", ->
      @cy.get("button").click()