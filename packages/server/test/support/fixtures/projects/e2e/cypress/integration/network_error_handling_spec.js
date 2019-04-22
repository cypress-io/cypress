describe('network error handling', function () {
  context('retries', function () {
    it('retries 3x to visit unreachable port', function () {
      cy.visit({
        url: 'http://localhost:13371/',
      })
    })

    it('works on the third try after two failed requests', function () {
      cy.visit({
        url: '/works-third-time',
      })
    })
  })
})
