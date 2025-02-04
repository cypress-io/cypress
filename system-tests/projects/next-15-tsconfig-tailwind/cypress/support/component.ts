// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import 'tailwindcss/tailwind.css'

// NOTE: we need to use the CJS require since we are using webpack alias to resolve the correct React (19),
// as the root of the monorepo is different (18). Webpack aliases don't support esm, so using the ESM import of
// 'cypress/react' will try to source esm dependencies from the root, which will have the wrong version of react/react-dom
// and throw an error. This does NOT have actual bearing on the end user experience, just our ability to test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { mount } = require('cypress/react')

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(<MyComponent />)
