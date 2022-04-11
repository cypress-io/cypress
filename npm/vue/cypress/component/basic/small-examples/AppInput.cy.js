/// <reference types="cypress" />

import { h } from 'vue'
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
      // TODO: use HTML syntax (not render function with `h`)
      // when it's working.
      // Blocked by upstream bug in Test Utils: https://github.com/vuejs/test-utils/issues/1166
      // mount(AppInput, {
      //   slots: {
      //     label: `<label for="username">Enter Username<label>`
      //   },
      // })
      label: () => h('label', { for: 'username' }, 'Enter Username'),
    },
  })

  // input element is present
  cy.get('input#username')

  // Get input field by label text we passed as slot
  cy.contains('label', 'Enter Username')
})
