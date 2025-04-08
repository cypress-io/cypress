import HelloWorld from './components/HelloWorld.vue'
import { mount } from 'cypress/vue'

describe('mount', () => {
  context('teardown', () => {
    beforeEach(() => {
      cy.get('[data-cy-root]').children().should('have.length', 0)
    })

    it('should mount', () => {
      // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
      // @ts-expect-error
      mount(HelloWorld)
    })

    it('should remove previous mounted component', () => {
      const props = (props) => ({ props, propsData: props })

      // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
      // @ts-expect-error
      mount(HelloWorld, props({ msg: 'Render 1' }))
      cy.contains('h1', 'Render 1')

      // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
      // @ts-expect-error
      mount(HelloWorld, props({ msg: 'Render 2' }))
      cy.contains('h1', 'Render 2')

      cy.contains('h1', 'Render 1').should('not.exist')
      cy.get('[data-cy-root]').children().should('have.length', 1)
    })
  })
})
