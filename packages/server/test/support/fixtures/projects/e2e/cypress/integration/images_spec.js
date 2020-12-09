/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("images", function() {
  it("can correctly load images when served from http server", () => cy
    .visit("http://localhost:3636")
    .window().then(win => new Cypress.Promise(function(resolve, reject) {
    const img = new win.Image;
    img.onload = resolve;
    img.onerror = reject;
    return img.src = "/static/javascript-logo.png";
  })));

  return it("can correctly load image when served from file system", () => cy
    .visit("/")
    .window().then(win => new Cypress.Promise(function(resolve, reject) {
    const img = new win.Image;
    img.onload = resolve;
    img.onerror = reject;
    return img.src = "/static/javascript-logo.png";
  })));
});
