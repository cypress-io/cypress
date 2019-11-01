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

    context "handles charCodes, keyCodes, and which for keyup, keydown, and keypress", ->
      characters = [
        ['.', 46, 190],
        ['/', 47, 191],
        ['{enter}', 13, 13],
        ['*', 42, 56],
        ['+', 43, 187],
        ['-', 45, 189],

      ]

      characters.forEach ([char, asciiCode, keyCode]) ->
        it "for #{char}", ->
          cy.window().then (win) ->
            win.$("input").one "keydown", (e) ->
              expect(e.charCode).to.equal(0)
              expect(e.which).to.equal(keyCode)
              expect(e.keyCode).to.equal(keyCode)

            win.$("input").one "keypress", (e) ->
              expect(e.charCode).to.equal(asciiCode)
              expect(e.which).to.equal(asciiCode)
              expect(e.keyCode).to.equal(asciiCode)

            win.$("input").one "keyup", (e) ->
              expect(e.charCode).to.equal(0)
              expect(e.which).to.equal(keyCode)
              expect(e.keyCode).to.equal(keyCode)

            cy.get("input").type(char)
