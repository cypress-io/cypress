import { mount, unmount } from 'cypress/react'

Cypress.Commands.add('mount', mount)
Cypress.Commands.add('unmount', unmount)