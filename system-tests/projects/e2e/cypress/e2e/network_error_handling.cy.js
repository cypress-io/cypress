describe('network error handling', function () {
  context('cy.visit() retries', function () {
    it('fails after retrying 5x', function () {
      cy.visit({
        url: '/immediate-reset?visit',
      })
    })

    it('works on the third try after two failed requests', function () {
      cy.visit({
        url: '/works-third-time/for-visit',
      })
      .contains('ok')
    })

    it('works on the third try after two 500 errors', function () {
      cy.visit({
        url: '/works-third-time-else-500/500-for-visit',
        retryOnStatusCodeFailure: true,
      })
      .contains('ok')
    })

    it('re-sends a <form> body on failures', function () {
      cy.visit({
        url: '/print-body-third-time-form',
      })
      .get('input[type=text]')
      .type('bar')

      cy.get('input[type=submit]')
      .click()

      cy.contains('{"foo":"bar"}')
    })
  })

  context('cy.request() retries', function () {
    it('fails after retrying 5x', function () {
      cy.request({
        url: '/immediate-reset?request',
      })
    })

    it('works on the third try after two failed requests', function () {
      cy.request({
        url: '/works-third-time/for-request',
      })
      .then(({ body }) => {
        expect(body).to.eq('ok')
      })
    })

    it('works on the third try after two 500 errors', function () {
      cy.request({
        url: '/works-third-time-else-500/500-for-request',
        retryOnStatusCodeFailure: true,
      })
      .then(({ body }) => {
        expect(body).to.eq('ok')
      })
    })
  })

  context('subresource retries', function () {
    it('on <img> tags', function () {
      cy.visit('/load-img-net-error.html')
    })

    it('on <script> tags', function () {
      cy.visit('/load-script-net-error.html')
    })
  })
})
