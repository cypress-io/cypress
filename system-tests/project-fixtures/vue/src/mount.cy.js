import HelloWorld from './components/HelloWorld.vue'

describe('mount', () => {
  context('teardown', () => {
    beforeEach(() => {
      cy.get('[data-cy-root]').children().should('have.length', 0)
    })

    it('should mount', () => {
      cy.mount(HelloWorld)
    })

    it('should remove previous mounted component', () => {
      // hack for vue2 vs vue mount
      const props = (props) => ({ props, propsData: props })

      cy.mount(HelloWorld, props({ msg: 'Render 1' }))
      cy.contains('h1', 'Render 1')
      cy.mount(HelloWorld, props({ msg: 'Render 2' }))
      cy.contains('h1', 'Render 2')

      cy.contains('h1', 'Render 1').should('not.exist')
      cy.get('[data-cy-root]').children().should('have.length', 1)
    })
  })

  it('should succeed to intercept with devServerPublicPathRoute', () => {
    cy.intercept('GET', 'http://localhost:3000/hello', (req) => {
      req.reply({
        statusCode: 200,
        body: { hello: 'world' },
      })
    }).as('helloRequest')

    cy.mount(HelloWorld)

    cy.get('#button').click()
    cy.wait('@helloRequest')
  })
})
