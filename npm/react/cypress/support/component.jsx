import '@testing-library/cypress/add-commands'

import { mount } from '@cypress/react'

Cypress.Commands.add('mount', mount)
