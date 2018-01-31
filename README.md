# cypress-react-unit-test [![Build Status](https://travis-ci.org/bahmutov/cypress-react-unit-test.svg?branch=master)](https://travis-ci.org/bahmutov/cypress-react-unit-test) [![Cypress.io tests](https://img.shields.io/badge/cypress.io-tests-green.svg?style=flat-square)](https://dashboard.cypress.io/#/projects/z9dxah)

> A little helper to unit test React components in the open source [Cypress.io](https://www.cypress.io/) E2E test runner **ALPHA**

## TLDR

* What is this? This package allows you to use [Cypress](https://www.cypress.io/) test runner to unit test your React components with zero effort.

* How is this different from [Enzyme](https://github.com/airbnb/enzyme)? It is similar in functionality BUT runs the component in the real browser with full power of Cypress E2E test runner: [live GUI, full API, screen recording, CI support, cross-platform](https://www.cypress.io/features/).

## Known problems

- [ ] some DOM events are not working when running all tests at once [#4](https://github.com/bahmutov/cypress-react-unit-test/issues/4)
- [x] cannot mock server XHR for injected components [#5](https://github.com/bahmutov/cypress-react-unit-test/issues/5)
- [x] cannot spy on `window.alert` [#6](https://github.com/bahmutov/cypress-react-unit-test/issues/6)

## Install

Requires [Node](https://nodejs.org/en/) version 6 or above.

```sh
npm install --save-dev cypress cypress-react-unit-test
```

## Use

```js
// import the component you want to test
import { HelloState } from '../../src/hello-x.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'
describe('HelloState component', () => {
  it('works', () => {
    // mount the component under test
    mount(<HelloState />)
    // start testing!
    cy.contains('Hello Spider-man!')
    // mounted component is returned from Cypress.component()
    Cypress.component().invoke('setState', {name: 'React'})
    Cypress.component().its('state').should('deep.equal', {
      name: 'React'
    })
    // check if GUI has rerendered
    cy.contains('Hello React!')
  })
})
```

![Unit testing React components](images/demo.png)

## Transpilation

How can we use features that require transpilation? Using [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress-webpack-preprocessor#readme). You can use [cypress/plugins/index.js](cypress/plugins/index.js) to configure any transpilation plugins you need.

For example, to enable class properties:

```js
// cypress/plugins/index.js
const webpack = require('@cypress/webpack-preprocessor')
const webpackOptions = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs)$/,
        loader: 'babel-loader',
        options: {
          presets: ['env', 'react'],
          plugins: ['transform-class-properties'],
        },
      }
    ]
  }
}

const options = {
  // send in the options from your webpack.config.js, so it works the same
  // as your app's code
  webpackOptions,
  watchOptions: {}
}

module.exports = on => {
  on('file:preprocessor', webpack(options))
}
```

Install dev dependencies

```shell
npm i -D @cypress/webpack-preprocessor \
  babel-loader babel-preset-es2015 babel-preset-react \
  babel-plugin-transform-class-properties
```

And write a component using class properties

```js
import React from 'react'

export class Transpiled extends React.Component {
  state = {
    count: 0
  }

  // ...
}
```

## Examples

All components are in [src](src) folder. All tests are in [cypress/integration](cypress/integration) folder.

* [hello-world-spec.js](cypress/integration/hello-world-spec.js) - testing the simplest React component from [hello-world.jsx](src/hello-world.jsx)
* [hello-x-spec.js](cypress/integration/hello-x-spec.js) - testing React component with props and state [hello-x.jsx](src/hello-x.jsx)
* [counter-spec.js](cypress/integration/counter-spec.js) clicks on the component and confirms the result
* [stateless-spec.js](cypress/integration/stateless-spec.js) shows testing a stateless component from [stateless.jsx](src/stateless.jsx)
* [transpiled-spec.js](cypress/integration/stateless-spec.js) shows testing a component with class properties syntax from [transpiled.jsx](src/stateless.jsx)
* [users-spec.js](cypress/integration/users-spec.js) shows how to observe XHR requests, mock server responses for component [users.jsx](src/users.jsx)
* [alert-spec.js](cypress/integration/alert-spec.js) shows how to spy on `window.alert` calls from your component [stateless-alert.jsx](src/stateless-alert.jsx)

## Large examples

* [bahmutov/calculator](https://github.com/bahmutov/calculator) tests multiple components: calculator App, Button, Display.

## Related tools

Same feature for unit testing components from other framesworks using Cypress

* [cypress-vue-unit-test](https://github.com/bahmutov/cypress-vue-unit-test) for Vue.js
* [cypress-hyperapp-unit-test](https://github.com/bahmutov/cypress-hyperapp-unit-test) for Hyperapp
* [cypress-svelte-unit-test](https://github.com/bahmutov/cypress-svelte-unit-test) for Svelte.js
