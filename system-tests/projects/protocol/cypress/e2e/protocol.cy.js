describe('protocol events', { baseUrl: 'http://foobar.com:2121' }, () => {
  beforeEach(() => {
    // cause the top-origin to change by visiting a different domain
    cy.visit('http://localhost:3131/index.html')
  })

  it('has protocol events', () => {
    // change the viewport so we get viewport:changed event
    cy.viewport(300, 200)

    // click an element so we get command logs with snapshots
    cy.contains('hi').click()

    cy.origin('http://foobar.com', () => {
      // verify changing the viewport inside cy.origin works
      cy.viewport(400, 500)

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000, { log: false })
    })
  })
})
