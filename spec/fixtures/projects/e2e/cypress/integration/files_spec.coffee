describe "files", ->
  context "cy.readFile", ->
    it "reads off files from the filesystem + converts json", ->
      cy
        .readFile("cypress/fixtures/example.json")
        .its("email").should("eq", "hello@cypress.io")

  context "cy.writeFile", ->
    it "writes the file to the filesystem, overwriting existing file", ->
      cy
        .writeFile("static/foo.txt", "")
        .writeFile("static/foo.txt", "bar")
        .readFile("static/foo.txt").should("equal", "bar")
