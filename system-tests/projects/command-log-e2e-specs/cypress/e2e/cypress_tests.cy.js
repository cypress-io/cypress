describe('Cypress Tests', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/dom.html')
  })

  describe('Describe Block 1', () => {
    context('Context Block A', () => {
      it('should perform test 1', () => {
        expect(true).to.eql(true)
      })
    })

    context('Context Block B', () => {
      it('should perform test 2', () => {
        expect(true).to.eql(true)
      })
    })
  })

  describe('Describe Block 2', () => {
    context('Context Block C', () => {
      it('should perform test 3', () => {
        expect(true).to.eql(true)
      })
    })

    context('Context Block D', () => {
      it('should perform test 4', () => {
        expect(true).to.eql(true)
      })
    })
  })
})
