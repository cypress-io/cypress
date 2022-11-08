# @cypress/solid

Mount Solid components in the open source [Cypress.io](https://www.cypress.io/) test runner **v10.7.0+**

> **Note:** This package is bundled with the `cypress` package and should not need to be installed separately. See the [Solid Component Testing Docs](#TODO) for mounting Solid components. Installing and importing `mount` from `@cypress/solid` should only be used for advanced use-cases.

## Install

- Requires Solid >= 1.5.0
- Requires Cypress v10.7.0 or later
- Requires [Node](https://nodejs.org/en/) version 12 or above

```sh
npm install --save-dev @cypress/solid
```

## Run

Open cypress test runner
```
npx cypress open --component
```

If you need to run test in CI
```
npx cypress run --component
```

For more information, please check the official docs for [running Cypress](https://on.cypress.io/guides/getting-started/opening-the-app#Quick-Configuration) and for [component testing](https://on.cypress.io/guides/component-testing/writing-your-first-component-test).

## Example

```js
import { mount } from '@cypress/solid'
import Hello from './Hello.jsx'

describe('Hello component', () => {
  it('render', () => {
    mount(Hello)
    // now use standard Cypress commands
    cy.contains('Hello World!').should('be.visible')
  })
})
```

## Compatibility

| @cypress/solid | cypress |
| -------------- | ------- |
| >= v1          | >= v10  |

## Development

Run `yarn build` to compile and sync packages to the `cypress` cli package.

Run `yarn cy:open` to open Cypress component testing against real-world examples.

Run `yarn test` to execute headless Cypress tests.

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
