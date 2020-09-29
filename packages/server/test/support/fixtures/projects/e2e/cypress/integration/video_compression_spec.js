const halfTests = Cypress.env('NUM_TESTS') / 2
const msPerTest = Cypress.env('MS_PER_TEST')

const testHalf = () => {
  Cypress._.times(halfTests, function (i) {
    it(`num: ${i + 1} makes some long tests`, function () {
      cy.wait(msPerTest)
    })
  })
}

testHalf()

it('top-level navigation', function () {
  // navigate in the middle of the test
  cy.visit('http://localhost:38883')
})

testHalf()
