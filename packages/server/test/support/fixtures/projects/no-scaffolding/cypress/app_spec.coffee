semverThreeDigitsRe = /\d+\.\d+\.\d+/

it "is true", ->
  expect(true).to.be.true

## TODO: probably move this to another spec when there's
## something else about generic configuration bootstrapping
it "has Cypress.version", ->
  expect(Cypress.version).to.match(semverThreeDigitsRe)
