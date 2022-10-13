# @cypress/lit

Mount Lit elements in the open source [Cypress.io](https://www.cypress.io/) test runner **v10.7.0+**

> **Note:** This package is bundled with the `cypress` package and should not need to be installed separately. See the [Lit Component Testing Docs](https://docs.cypress.io/guides/component-testing/quickstart-lit#Configuring-Component-Testing) for mounting Lit components. Installing and importing `mount` from `@cypress/lit` should only be used for advanced use-cases.

## Install

- Requires Lit >= 2
- Requires Cypress v10.7.0 or later
- Requires [Node](https://nodejs.org/en/) version 12 or above

```sh
npm install --save-dev @cypress/lit
```

## Run

Open cypress test runner
```sh
npx cypress open --component
```

If you need to run test in CI
```sh
npx cypress run --component
```

For more information, please check the official docs for [running Cypress](https://on.cypress.io/guides/getting-started/opening-the-app#Quick-Configuration) and for [component testing](https://on.cypress.io/guides/component-testing/writing-your-first-component-test).

## Example

```js
import { mount } from '@cypress/lit'
import { html } from 'lit'
import HelloWorld from './HelloWorld'

describe('HelloWorld component', () => {
  it('works', () => {
    mount(HelloWorld, html`<hello-world></hello-world>`).as('element')
    // now use standard Cypress commands
    cy.get('@element').contains('Hello World!').should('be.visible')
  })
})
```

## Options

In most cases, the component already imports its own styles, thus it looks "right" during the test. If you need another CSS, the simplest way is to import it from the spec file:

```js
// src/HelloWorld
import './styles/main.css'
import HelloWorld from './HelloWorld'

it('looks right', () => {
  // styles are applied
  mount(HelloWorld, html`<hello-world></hello-world>`).as('element')
})
```

> Note: Global styles can be imported in your component support file, allowing the styles to apply to all mounted components.

## Compatibility

| @cypress/lit | cypress |
| ------------ | ------- |
| >= v1        | >= v10  |

## Development

Run `yarn build` to compile and sync packages to the `cypress` cli package.

Run `yarn cy:open` to open Cypress component testing against real-world examples.

Run `yarn test` to execute headless Cypress tests.

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
