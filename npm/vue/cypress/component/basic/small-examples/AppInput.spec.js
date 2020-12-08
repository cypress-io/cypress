/// <reference types="cypress" />

import AppInput from './AppInput.vue'
import { mount } from '@cypress/vue'

// TODO: Allow configuring `prefixIdentifiers` compiler option in
// Vue Test Utils Next.
// https://github.com/vuejs/vue-test-utils-next/blob/a8234faf30480ef5857b2862002d006c8bdf9964/src/utils/compileSlots.ts#L17
// This is not valid in a browser environment.
xit('renders label', () => {
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
