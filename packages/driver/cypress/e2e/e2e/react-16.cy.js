// TODO(webkit): fix+unskip for webkit release
describe('react v16.0.0', { browser: '!webkit' }, () => {
  context('fires onChange events', () => {
    beforeEach(() => {
      cy.visit('/fixtures/react-16.html')
    })

    it('input', () => {
      cy
      .get('#react-container input[type=text]').type('foo').blur()
      .window().its('onChangeEvents').should('eq', 3)
    })

    it('email', () => {
      cy
      .get('#react-container input[type=email]').type('foo').blur()
      .window().its('onChangeEvents').should('eq', 3)
    })

    it('number', () => {
      cy
      .get('#react-container input[type=number]').type('123').blur()
      .window().its('onChangeEvents').should('eq', 3)
    })
  })
})
