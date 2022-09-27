# @cypress/angular

Mount Angular components in the open source [Cypress.io](https://www.cypress.io/) test runner **v7.0.0+**

> **Note:** This package is bundled with the `cypress` package and should not need to be installed separately. See the [Angular Component Testing Docs](https://docs.cypress.io/guides/component-testing/quickstart-angular#Configuring-Component-Testing) for mounting Angular components. Installing and importing `mount` from `@cypress/angular` should only be used for advanced use-cases.

## Install

- Requires Cypress v7.0.0 or later
- Requires [Node](https://nodejs.org/en/) version 12 or above

```sh
npm install --save-dev @cypress/angular
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

## API

- `mount` is the most important function, allows to mount a given Angular component as a mini web application and interact with it using Cypress commands
- `MountConfig` Configuration used to configure your test
- `createOutputSpy` factory function that creates new EventEmitter for your component and spies on it's `emit` method.

## Examples

```ts
import { mount } from '@cypress/angular'
import { HelloWorldComponent } from './hello-world.component'

describe('HelloWorldComponent', () => {
  it('works', () => {
    mount(HelloWorldComponent)
    // now use standard Cypress commands
    cy.contains('Hello World!').should('be.visible')
  })
})
```

```ts
import { mount } from '@cypress/angular'
import { HelloWorldComponent } from './hello-world.component'

describe('HelloWorldComponent', () => {
  it('works', () => {
    mount('<app-hello-world></app-hello-world>', {
      declarations: [HelloWorldComponent]
    })
    // now use standard Cypress commands
    cy.contains('Hello World!').should('be.visible')
  })
})
```

Look at the examples in [cypress-component-testing-apps](https://github.com/cypress-io/cypress-component-testing-apps) repo. Here in the `angular` and `angular-standalone` folders are the two example applications showing various testing scenarios.


## Compatibility

| @cypress/angular | cypress |
| -------------- | ------- |
| >= v1          | >= v10.5  |

## Development

Run `yarn build` to compile and sync packages to the `cypress` cli package.

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
