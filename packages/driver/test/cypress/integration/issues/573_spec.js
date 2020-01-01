/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const run = () => cy.window()
.then({ timeout: 60000 }, win => new Cypress.Promise(function(resolve) {
  const i = win.document.createElement("iframe");
  i.onload = resolve;
  i.src = "/basic_auth";
  return win.document.body.appendChild(i);
})).get("iframe").should($iframe => expect($iframe.contents().text()).to.include("basic auth worked")).window().then({ timeout: 60000 }, win => new Cypress.Promise(function(resolve, reject) {
  const xhr = new win.XMLHttpRequest();
  xhr.open("GET", "/basic_auth");
  xhr.onload = function() {
    try {
      expect(this.responseText).to.include("basic auth worked");
      return resolve(win);
    } catch (err) {
      return reject(err);
    }
  };
  return xhr.send();
})).then({ timeout: 60000 }, win => new Cypress.Promise(function(resolve, reject) {
  //# ensure other origins do not have auth headers attached
  const xhr = new win.XMLHttpRequest();
  xhr.open("GET", "http://localhost:3501/basic_auth");
  xhr.onload = function() {
    try {
      expect(this.status).to.eq(401);
      return resolve(win);
    } catch (err) {
      return reject(err);
    }
  };
  return xhr.send();
}));

// cy.visit("http://admin:admin@the-internet.herokuapp.com/basic_auth")

describe("basic auth", function() {
  it("can visit with username/pw in url", function() {
    cy.visit("http://cypress:password123@localhost:3500/basic_auth");
    return run();
  });

  return it("can visit with auth options", function() {
    cy.visit("http://localhost:3500/basic_auth", {
      auth: {
        username: "cypress",
        password: "password123"
      }
    });
    return run();
  });
});
