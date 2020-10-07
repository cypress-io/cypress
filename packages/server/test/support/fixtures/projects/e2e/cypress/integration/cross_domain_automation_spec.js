describe('automations', function () {
  it('get cross domain localStorage', () => {
    cy.visit('http://localhost:4466/cross_domain_iframe')
    .then(() => {
      return Cypress.Session.getCurrentSessionDataForUrls(['https://127.0.0.2:44665'])
    })
    .then((result) => {
      expect(result).deep.eq([{ domain: 'https://127.0.0.2:44665', value: { foo: 'bar' } }])
    })
  })
})
