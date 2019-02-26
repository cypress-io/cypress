it "can inject text from an extension", ->
  cy
    .visit("/index.html")
    .get("#extension").should("contain", "inserted from extension!")
