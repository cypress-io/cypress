/// <reference types="cypress" />

import AppInput from './AppInput.vue'
import { mount } from '@cypress/vue'

it('renders label', () => {
  mount(AppInput, {
    propsData: {
      name: 'username',
      inputId: 'username',
    },
    // passing slots to the component #364
    slots: {
      label: `<label for="username">Enter Username</label>`,
    },
  })

  // input element is present
  cy.get('input#username')

  // Get input field by label text we passed as slot
  cy.contains('label', 'Enter Username')
})
