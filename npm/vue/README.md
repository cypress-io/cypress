# @cypress/vue

Mount Vue components in the open source [Cypress.io](https://www.cypress.io/) test runner **v7.0.0+**

> **Note:** This package is bundled with the `cypress` package and should not need to be installed separately. See the [Vue Component Testing Docs](https://docs.cypress.io/guides/component-testing/quickstart-vue#Configuring-Component-Testing) for mounting Vue components. Installing and importing `mount` from `@cypress/vue` should only be used for advanced use-cases.

### How is this different from @cypress/vue2?
Cypress packages the current version of Vue under @cypress/vue, and older versions under separate package names. Use [@cypress/vue2](https://github.com/cypress-io/cypress/tree/develop/npm/vue2) if you're still using vue@2, and this package if you're on vue@3.

## Installation

- Requires Cypress v7.0.0 or later
- Requires [Node](https://nodejs.org/en/) version 12 or above
- Requires Vue 3.x. If you are using Vue 2.x, you want [@cypress/vue2](https://github.com/cypress-io/cypress/tree/develop/npm/vue2) instead.

```sh
npm i -D @cypress/vue
```

## Usage and Examples

```js
// components/HelloWorld.spec.js
import { mount } from '@cypress/vue'
import { HelloWorld } from './HelloWorld.vue'
describe('HelloWorld component', () => {
  it('works', () => {
    mount(HelloWorld)
    // now use standard Cypress commands
    cy.contains('Hello World!').should('be.visible')
  })
})
```

Look at the examples in [cypress/component](cypress/component) folder. Here is the list of examples showing various testing scenarios.

### Styles

One option for styling your components is to import stylesheets into your test file. See [docs/styles.md](./docs/styles.md) for full list of options.

```js
import Todo from './Todo.vue'
import '../styles/main.css'
const todo = {
  id: '123',
  title: 'Write more tests',
}

mount(Todo, { props: { todo } })
```

### Global Vue Options

You can pass extensions (global components, mixins, modules to use)
when mounting Vue component. Use `{ extensions: { ... }}` object inside
the `options`.

- `components` - object of 'id' and components to register globally, see [Components](npm/vue/cypress/component/basic/components) example
- `use` (alias `plugins`) - list of plugins, see [Plugins](npm/vue/cypress/component/basic/plugins)
- `mixin` (alias `mixins`) - list of global mixins, see [Mixins](npm/vue/cypress/component/basic/mixins) example
- `filters` - hash of global filters, see [Filters](npm/vue/cypress/component/basic/filters) example

## Development

Run `yarn build` to compile and sync packages to the `cypress` cli package.

Run `yarn cy:open` to open Cypress component testing against real-world examples.

Run `yarn test` to execute headless Cypress tests.

## Compatibility

| @cypress/vue | cypress |
| ------------ | ------- |
| <= v3        | <= v9   |
| >= v4        | >= v10  |

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
