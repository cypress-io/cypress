describe('src/dom/jquery', () => {
  context('.isJquery', () => {
    it('does not get confused when window contains jquery function', () => {
      window.jquery = () => {}

      expect(Cypress.dom.isJquery(window)).to.be.false
    })

    it('is true for actual jquery instances', () => {
      expect(Cypress.dom.isJquery(Cypress.$(':first'))).to.be.true
    })
  })
})
