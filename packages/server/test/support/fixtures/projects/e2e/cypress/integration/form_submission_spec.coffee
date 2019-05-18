describe "<form> submissions", =>
  it "can submit a form correctly", =>
    cy
    .visit("/")
    .get("input[type=text]")
    .type("hello world")
    .get("input[type=submit]")
    .click()
    .document()
    .contains('hello world')
