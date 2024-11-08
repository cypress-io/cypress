import { mount } from 'cypress/vue'
import HelloWorld from './HelloWorld.vue'

describe('<Logo />', () => {
  it('contains the default slot in its h1', () => {
    const slotContent = 'Welcome to testing in Vue CLI'

    // TODO: fix typings issue with mount. @see https://github.com/cypress-io/cypress/issues/29799
    // @ts-expect-error
    mount(HelloWorld, {
      propsData: {
        msg: slotContent,
      },
    })

    cy.contains('h1', slotContent)
  })
})
