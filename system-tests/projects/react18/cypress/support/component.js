import { mount, unmount } from 'cypress/react18'

import './backgroundColor.css'

Cypress.Commands.add('mount', mount)
Cypress.Commands.add('unmount', unmount)
