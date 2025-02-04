import 'tailwindcss/tailwind.css'

import { mount } from 'cypress/react'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)
