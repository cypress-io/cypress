/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("keyboard", function() {
  beforeEach(() => cy.visit("/fixtures/jquery.html"));

  return context("modifiers", function() {
    it("fires keyboard and click events with modifier", () => cy
      .window().then(function(win) {
        win.$("input").one("keyup", function(e) {
          expect(e.ctrlKey).to.be.true;
          return expect(e.which).to.equal(83);
        });
        win.$("button").one("click", e => expect(e.ctrlKey).to.be.true);

        cy.get("input").type("{ctrl}s", {release: false});
        return cy.get("button").click();
    }));

    it("releases modifiers between tests", () => cy
      .window().then(function(win) {
        win.$("input").one("keyup", e => expect(e.ctrlKey).to.be.false);

        return cy.get("input").type("s");
    }));

    return context("handles charCodes, keyCodes, and which for keyup, keydown, and keypress", function() {
      const characters = [
        ['.', 46, 190],
        ['/', 47, 191],
        ['{enter}', 13, 13],
        ['*', 42, 56],
        ['+', 43, 187],
        ['-', 45, 189],

      ];

      return characters.forEach(([char, asciiCode, keyCode]) => it(`for ${char}`, () => cy.window().then(function(win) {
        win.$("input").one("keydown", function(e) {
          expect(e.charCode).to.equal(0);
          expect(e.which).to.equal(keyCode);
          return expect(e.keyCode).to.equal(keyCode);
        });

        win.$("input").one("keypress", function(e) {
          expect(e.charCode).to.equal(asciiCode);
          expect(e.which).to.equal(asciiCode);
          return expect(e.keyCode).to.equal(asciiCode);
        });

        win.$("input").one("keyup", function(e) {
          expect(e.charCode).to.equal(0);
          expect(e.which).to.equal(keyCode);
          return expect(e.keyCode).to.equal(keyCode);
        });

        return cy.get("input").type(char);
      })));
    });
  });
});
