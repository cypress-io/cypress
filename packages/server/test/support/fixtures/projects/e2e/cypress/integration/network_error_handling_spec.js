describe('network error handling', function () {
  context('retries', function () {
    it('retries 3x', function () {
      cy.visit({
        url: '/immediate-reset',
      })
    })

    it('works on the third try after two failed requests', function () {
      cy.visit({
        url: '/works-third-time',
      })
    })
  })
})
