import { mount } from 'cypress/vue2'
import HelloWorld from './HelloWorld.vue'

describe('<Logo />', () => {
  it('contains the default slot in its h1', () => {
    const slotContent = 'Welcome to testing in Vue CLI'

    mount(HelloWorld, {
      propsData: {
        msg: slotContent,
      },
    })

    cy.contains('h1', slotContent)
  })

  it('throws error when receiving removed mounting options', () => {
    for (const key of ['cssFile', 'cssFiles', 'style', 'styles', 'stylesheet', 'stylesheets']) {
      expect(() => mount(HelloWorld, { 
        [key]: `body { background: red; }`
      })).to.throw(
        `The \`${key}\` mounting option is no longer supported. See https://on.cypress.io/migration-11-0-0-component-testing-updates to migrate.`
      )
    }
  })
})
