describe "Clicks Integration Tests", ->
  context "fixed-nav", ->
    enterCommandTestingMode("fixed-nav")

    describe "fixed nav", ->
      it "can click inputs under a fixed-position nav", ->
        @cy.get("button").click()

  context "dropdown", ->
    enterCommandTestingMode("dropdown", {replaceIframeContents: false})

    describe "animating dropdown with fixed background", ->
      ## this tests a kendo drop down opening
      ## as it opens the element from position returns the background element
      ## which is fixed position
      ## the fixed position element cannot be scrolled and thus an endless loop
      ## is created
      it "can click an animating element when the element behind it is fixed position and cannot be scrolled", ->
        @cy.window().then (win) ->
          k = win.$("#dropdown").getKendoDropDownList()
          k.open()

        @cy
          .contains(".k-item", "Strawberries").click()
          .window().then (win) ->
            k = win.$("#dropdown").getKendoDropDownList()
            expect(k.text()).to.eq "Strawberries"
