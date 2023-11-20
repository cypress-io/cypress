import { mount } from 'cypress/vue'
import HelloWorld from './HelloWorld.vue'

it('works', () => {
  mount(HelloWorld, {
    props: {
      msg: 'Hello!',
    },
  })

  cy.contains('Hello!')
})
