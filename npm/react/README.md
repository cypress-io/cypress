# @cypress/react

Mount React components in the open source [Cypress.io](https://www.cypress.io/) test runner **v7.0.0+**

> **Note:** This package is bundled with the `cypress` package and should not need to be installed separately. See the [React Component Testing Docs](https://docs.cypress.io/guides/component-testing/quickstart-react#Configuring-Component-Testing) for mounting React components. Installing and importing `mount` from `@cypress/react` should only be used for advanced use-cases.

## Install

- Requires Cypress v7.0.0 or later
- Requires [Node](https://nodejs.org/en/) version 12 or above

```sh
npm install --save-dev @cypress/react
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

- `mount` is the most important function, allows to mount a given React component as a mini web application and interact with it using Cypress commands
- `createMount` factory function that creates new `mount` function with default options
- `unmount` removes previously mounted component, mostly useful to test how the component cleans up after itself
- `mountHook` mounts a given React Hook in a test component for full testing, see `hooks` example

## Examples

```js
import React from 'react'
import { mount } from '@cypress/react'
import { HelloWorld } from './hello-world.jsx'
describe('HelloWorld component', () => {
  it('works', () => {
    mount(<HelloWorld />)
    // now use standard Cypress commands
    cy.contains('Hello World!').should('be.visible')
  })
})
```

Look at the examples in [cypress/component](cypress/component) folder. Here is the list of examples showing various testing scenarios.

## Options

In most cases, the component already imports its own styles, thus it looks "right" during the test. If you need another CSS, the simplest way is to import it from the spec file:

```js
// src/Footer.spec.js
import './styles/main.css'
import Footer from './Footer'
it('looks right', () => {
  // styles are applied
  mount(<Footer />)
})
```

### Extra styles

You can pass additional styles, css files and external stylesheets to load, see [docs/styles.md](./docs/styles.md) for the full list of options.

```js
const todo = {
  id: '123',
  title: 'Write more tests',
}
mount(<Todo todo={todo} />, {
  stylesheets: [
    'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
  ],
})
```

You may also specify the `ReactDOM` package to use. This can be useful in complex monorepo setups that have different versions of React and React DOM installed. If you see an error relating to [mismatching versions of React or React DOM](https://reactjs.org/warnings/invalid-hook-call-warning.html#mismatching-versions-of-react-and-react-dom), this may be the solution. You can do this using the `ReactDom` option:

```jsx
// if you have multiple versions of ReactDom in your monorepo
import ReactDom from 'react-dom'

mount(<Todo todo={todo} />, {
  stylesheets: [
    'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
  ],
  ReactDom
})
```

## Compatibility

| @cypress/react | cypress |
| -------------- | ------- |
| <= v5          | <= v9   |
| >= v6          | >= v10  |

## Development

Run `yarn build` to compile and sync packages to the `cypress` cli package.

Run `yarn cy:open` to open Cypress component testing against real-world examples.

Run `yarn test` to execute headless Cypress tests.

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/master/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
