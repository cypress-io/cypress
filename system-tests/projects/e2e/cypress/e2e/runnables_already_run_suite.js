// https://github.com/cypress-io/cypress/issues/9026
describe('Top level describe ', () => {
  before(() => {
    // beforeAll hook needed to reproduce issue
  })

  beforeEach(() => {})

  describe('suite 1', () => {
    it('should pass', () => {
      cy.visit('http://localhost:3434')
      expect(true).to.be.true
    })
  })

  describe('suite 2', () => {
    it('should fail', () => {
      cy.visit('http://localhost:4545').then(() => {
        expect(true).to.be.false
      })
    })
  })
})
