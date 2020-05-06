/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//# https://github.com/cypress-io/cypress/issues/741
describe("zone.js", () => it("can serialize XHRs without blowing out the stack", () => cy
.visit("/fixtures/zonejs.html")
.window().then({ timeout: 30000 }, win => new Promise(function(resolve, reject) {
  const xhr = new win.XMLHttpRequest();

  xhr.open("HEAD", "/");
  xhr.send();

  return xhr.onload = function() {
    try {
      Cypress.Log.toSerializedJSON(xhr);
      return resolve();
    } catch (err) {
      return reject(err);
    }
  };
}))));
