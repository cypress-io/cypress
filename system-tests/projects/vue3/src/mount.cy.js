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
      const props = (props) => ({ props, propsData: props })

      cy.mount(HelloWorld, props({ msg: 'Render 1' }))
      cy.contains('h1', 'Render 1')
      cy.mount(HelloWorld, props({ msg: 'Render 2' }))
      cy.contains('h1', 'Render 2')

      cy.contains('h1', 'Render 1').should('not.exist')
      cy.get('[data-cy-root]').children().should('have.length', 1)
    })
  })
})
