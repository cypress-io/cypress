// @ts-nocheck
const url = 'https://localhost:3000'

describe('Certificate validations', () => {
  it('Fails with 404 (No certificate provided)', () => {
    cy.request({
      url,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
    })
  })

  it('Succeeds with 200 (User certificate provided)', () => {
    cy.chooseCert('user')
    cy.request({
      url,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.eq('200: User Access Granted')
    })
  })

  it('Succeeds with 200 (Admin certificate provided)', () => {
    cy.chooseCert('admin')
    cy.request({
      url,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.eq('200: Admin Access Granted')
    })
  })
})
