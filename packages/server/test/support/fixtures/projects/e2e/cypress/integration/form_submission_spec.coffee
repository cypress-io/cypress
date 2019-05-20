Cypress.Commands.add 'setFile', { prevSubject: "element" }, (element, filePath, title, description, copyright) ->
  mimeTypes =
    jpeg: "image/jpeg"
    jpg: "image/jpeg"
    png: "image/png"
    pdf: "application/pdf"
  filePathSplitted = filePath.split('.').pop()
  mimeType = if mimeTypes[filePathSplitted] != undefined then mimeTypes[filePathSplitted] else null

  cy.fixture(filePath, "base64").then (image) ->
    Cypress.Blob.base64StringToBlob(image).then (blob) ->
      elementNode = element[0]
      file = new File([ blob ], filePath, type: mimeType)
      dataTransfer = new DataTransfer
      dataTransfer.items.add file
      elementNode.files = dataTransfer.files
      elementNode.dispatchEvent new Event("change", bubbles: true)

describe "<form> submissions", =>
  it "can submit a form correctly", =>
    cy
    .visit("/")
    .get("input[type=text]")
    .type("hello world")
    .get("input[type=submit]")
    .click()
    .document()
    .contains('hello+world')

  it "can submit a multipart/form-data form correctly", =>
    cy
    .visit("/multipart-form-data")
    .get("input[type=text]")
    .type("hello world")
    .get("input[type=submit]")
    .click()
    .document()
    .contains('hello world')

  context "can submit a multipart/form-data form with attachments", =>
    testUpload = (fixturePath) ->
      cy.visit("/multipart-with-attachment?fixturePath=#{fixturePath}")
      .get("input[type=file]")
      .setFile(fixturePath)
      .get("input[type=submit]")
      .click()
      .document()
      .contains('files match')

    it "image/png", =>
      testUpload("../../static/javascript-logo.png")

    it "application/pdf", =>
      testUpload("sample.pdf")

    it "image/jpeg", =>
      testUpload("sample.jpg")

    ## https://github.com/cypress-io/cypress/issues/4253
    it "large application/pdf", =>
      testUpload("bigger-sample.pdf")

    ## https://github.com/cypress-io/cypress/issues/4240
    it "large image/jpeg", =>
      ## 16MB image, too big to include with git repo
      cy.exec("curl https://test-page-speed.cypress.io/files/huge-image.jpg -o cypress/fixtures/huge-image.jpg")

      testUpload("huge-image.jpg")
