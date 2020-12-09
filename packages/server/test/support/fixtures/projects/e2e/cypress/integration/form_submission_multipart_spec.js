/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { Blob, _ } = Cypress;

Cypress.Commands.add('setFile', { prevSubject: "element" }, function(element, filePath) {
  const mimeTypes = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf"
  };

  const filePathSplitted = filePath.split('.').pop();
  const mimeType = mimeTypes[filePathSplitted] !== undefined ? mimeTypes[filePathSplitted] : null;

  const fixtureOrReadFile = function(filePath) {
    if (_.startsWith(filePath, "/")) {
      return cy.readFile(filePath, "base64");
    }

    return cy.fixture(filePath, "base64");
  };

  return fixtureOrReadFile(filePath).then(image => new Promise(resolve => { 
    const blob = Blob.base64StringToBlob(image);
    const elementNode = element[0];
    const file = new File([ blob ], filePath, {type: mimeType});
    const dataTransfer = new DataTransfer;
    dataTransfer.items.add(file);
    elementNode.files = dataTransfer.files;
    const result = elementNode.dispatchEvent(new Event("change", { bubbles: true }));

    return resolve(result);
  }));
});  

describe("<form> submissions", function() {
  it("can submit a form correctly", () => cy
  .visit("/")
  .get("input[type=text]")
  .type("hello world")
  .get("input[type=submit]")
  .click()
  .document()
  .contains('hello+world'));

  it("can submit a multipart/form-data form correctly", () => cy
  .visit("/multipart-form-data")
  .get("input[type=text]")
  .type("hello world")
  .get("input[type=submit]")
  .click()
  .document()
  .contains('hello world'));

  return context("can submit a multipart/form-data form with attachments", function() {
    const testUpload = (fixturePath, containsOpts= {}) => cy.visit(`/multipart-with-attachment?fixturePath=${fixturePath}`)
    .get("input[type=file]")
    .setFile(fixturePath)
    .get("input[type=submit]")
    .click()
    .document()
    .contains('files match', containsOpts);

    it("image/png", () => testUpload("../../static/javascript-logo.png"));

    it("application/pdf", () => testUpload("sample.pdf"));

    it("image/jpeg", () => testUpload("sample.jpg"));

    //# https://github.com/cypress-io/cypress/issues/4253
    it("large application/pdf", () => testUpload("bigger-sample.pdf"));

    //# https://github.com/cypress-io/cypress/issues/4240
    return it("large image/jpeg", () => testUpload(Cypress.env("PATH_TO_LARGE_IMAGE"), {
      timeout: 120000
    }));
  });
});
