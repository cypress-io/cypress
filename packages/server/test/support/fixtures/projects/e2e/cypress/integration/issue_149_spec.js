/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("fails",  () => cy.then(function() {
  throw new Error("this should fail here");
}));

it("executes more commands",  () => cy
  .wrap({foo: "bar"}).its("foo").should("eq", "bar")
  .writeFile("foo.js", "bar"));
