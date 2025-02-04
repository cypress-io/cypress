import { mount } from 'cypress/vue'
import HelloWorld from './HelloWorld.vue'

it('works', () => {
  // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
  mount(HelloWorld, {
    props: {
      msg: 'Hello!',
    },
  })

  cy.contains('Hello!')
})
