it "fails",  ->
  cy.then  ->
    throw new Error "this should fail here"

it "executes more commands",  ->
  cy
    .wrap({foo: "bar"}).its("foo").should("eq", "bar")
    .writeFile("foo.js", "bar")
