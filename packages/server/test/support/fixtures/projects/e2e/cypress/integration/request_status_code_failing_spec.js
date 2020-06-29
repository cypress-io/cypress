/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("when status code isnt 2xx or 3xx", () => it("fails", () => cy.request("http://localhost:2294/statusCode?code=503")));