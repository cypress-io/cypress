import { mount } from '@cypress/vue'

const template = `
    <div id="app">
      {{ message }}
    </div>
  `

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Mount component', () => {
  // hmm, there are no more options to pass

  const component = {
    template,
    data () {
      return {
        message: 'Hello Vue!',
      }
    },
  }

  beforeEach(() => {
    mount(component)
  })

  it('shows hello', () => {
    cy.contains('Hello Vue!')
  })
})
