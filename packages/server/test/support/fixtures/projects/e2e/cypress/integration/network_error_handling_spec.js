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
    })

    it('works on the third try after two 500 errors', function () {
      cy.visit({
        url: '/works-third-time-else-500/500-for-visit',
        retryOnStatusCodeFailure: true,
      })
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
    })

    it('works on the third try after two 500 errors', function () {
      cy.request({
        url: '/works-third-time-else-500/500-for-request',
        retryOnStatusCodeFailure: true,
      })
    })
  })

  context('subresource retries', function () {
    it('on <img> tags', function () {
      cy.visit('/load-img-net-error.html')
    })

    it('on <script> tags', function () {
      cy.visit('load-script-net-error.html')
    })
  })
})
