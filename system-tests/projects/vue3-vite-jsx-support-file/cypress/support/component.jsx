import { mount } from 'cypress/vue'

Cypress.Commands.add('mount', (Component, options = {}) => {
  const { props, ...mountOptions } = options

  return mount(() => <div class="wrap"><Component {...props} /></div>, mountOptions)
})
