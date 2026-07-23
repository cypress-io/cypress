/* eslint-disable no-undef */
describe('http2 cy.request', () => {
  it('issues cy.request over HTTP/2', () => {
    cy.request('/protocol').then((resp) => {
      expect(resp.status).to.eq(200)
      expect(resp.body).to.deep.eq({ protocol: '2.0' })
    })
  })
})
