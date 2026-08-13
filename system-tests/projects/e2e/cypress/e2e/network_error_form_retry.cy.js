// Separate from the other network error specs because only the Node MITM proxy
// re-sends the body, so this holds in one proxy mode rather than both.
describe('network error handling', function () {
  context('cy.visit() retries', function () {
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
})
