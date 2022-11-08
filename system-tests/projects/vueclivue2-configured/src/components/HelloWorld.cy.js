import { mount } from 'cypress/vue2'
import HelloWorld from './HelloWorld.vue'
import GlobalComponentWithCustomDirective from './GlobalComponentWithCustomDirective.vue'
import custom from '../directive'

describe('<Logo />', () => {
  it('contains the default slot in its h1', () => {
    const slotContent = 'Welcome to testing in Vue CLI'

    mount(HelloWorld, {
      propsData: {
        msg: slotContent,
      },
      extensions: {
        components: { 
          // stubbing for simplicity, this smoke test does not depend on
          // GlobalComponent
          GlobalComponentWithCustomDirective: {
            render: h => h('div')
          }
        },
      }
    })

    cy.contains('h1', slotContent)
  })

  it('Vue2 custom directive should work ', () => {
    mount(GlobalComponentWithCustomDirective, {
      extensions: {
        directives: { custom },
      },
    })

    cy.get('.child').should('have.attr', 'data-custom', 'testing123')
  })

  it('Vue2 custom directive should work in nested component', () => {
    const slotContent = 'Welcome to testing in Vue CLI'

    mount(HelloWorld, {
      propsData: {
        msg: slotContent,
      },
      extensions: {
        components: { GlobalComponentWithCustomDirective },
        directives: { custom },
      },
    })

    cy.get('.child').should('have.attr', 'data-custom', 'testing123')
  })
})
