import { mount } from '@cypress/vue'

import App from '../../src/App.vue'

describe('App', () => {
  it('renders', () => {
    mount(App)
    cy.get('div').contains('Welcome to the app!')
  })
})
