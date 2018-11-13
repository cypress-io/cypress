describe "keyboard", ->
  beforeEach ->
    cy.visit("/fixtures/jquery.html")

  context "modifiers", ->
    it "fires keyboard and click events with modifier", ->
      cy
        .window().then (win) ->
          win.$("input").one "keyup", (e) ->
            expect(e.ctrlKey).to.be.true
            expect(e.which).to.equal(83)
          win.$("button").one "click", (e) ->
            expect(e.ctrlKey).to.be.true

          cy.get("input").type("{ctrl}s", {release: false})
          cy.get("button").click()

    it "releases modifiers between tests", ->
      cy
        .window().then (win) ->
          win.$("input").one "keyup", (e) ->
            expect(e.ctrlKey).to.be.false

          cy.get("input").type("s")

    it "handles charCodes, keyCodes, and which for keyup, keydown, and keypress", ->
      cy.window().then (win) ->
        win.$("input").one "keyup", (e) ->
          expect(e.charCode).to.equal(0)
          expect(e.which).to.equal(190)
          expect(e.keyCode).to.equal(190)

        win.$("input").one "keydown", (e) ->
          expect(e.charCode).to.equal(0)
          expect(e.which).to.equal(190)
          expect(e.keyCode).to.equal(190)

        win.$("input").one "keypress", (e) ->
          expect(e.charCode).to.equal(46)
          expect(e.which).to.equal(46)
          expect(e.keyCode).to.equal(46)

        cy.get("input").type(".")
