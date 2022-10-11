import { mount, unmount } from 'cypress/react'

import './backgroundColor.css'

Cypress.Commands.add('mount', mount)
Cypress.Commands.add('unmount', unmount)
