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
