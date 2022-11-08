# @cypress/vue2

Mount Vue components in the open source [Cypress.io](https://www.cypress.io/) test runner **v7.0.0+**

> **Note:** This package is bundled with the `cypress` package and should not need to be installed separately. See the [Vue Component Testing Docs](https://docs.cypress.io/guides/component-testing/quickstart-vue#Configuring-Component-Testing) for mounting Vue components. Installing and importing `mount` from `@cypress/vue` should only be used for advanced use-cases.

### How is this different from @cypress/vue?
Cypress packages the current version of Vue under @cypress/vue, and older versions under separate package names. Use [@cypress/vue](https://github.com/cypress-io/cypress/tree/develop/npm/vue) if you're up to date, and this package if you're still using vue@2.

## Installation

- Requires Cypress v7.0.0 or later
- Requires [Node](https://nodejs.org/en/) version 12 or above
- Requires Vue 2.x. If you are using Vue 3.0.0 or later, you want [@cypress/vue](https://github.com/cypress-io/cypress/tree/develop/npm/vue) instead.

```sh
npm i -D @cypress/vue2
```

## Usage and Examples

```js
// components/HelloWorld.spec.js
import { mount } from '@cypress/vue2'
import { HelloWorld } from './HelloWorld.vue'
describe('HelloWorld component', () => {
  it('works', () => {
    mount(HelloWorld)
    // now use standard Cypress commands
    cy.contains('Hello World!').should('be.visible')
  })
})
```

### Options

You can pass additional styles, css files and external stylesheets to load, see [docs/styles.md](./docs/styles.md) for full list.

```js
import Todo from './Todo.vue'
const todo = {
  id: '123',
  title: 'Write more tests',
}

mount(Todo, {
  propsData: { todo },
  stylesheets: [
    'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
  ],
})
```

### Global Vue Options

You can pass extensions (global components, mixins, modules to use)
when mounting Vue component. Use `{ extensions: { ... }}` object inside
the `options`.

- `components` - object of 'id' and components to register globally, see [Components](cypress/component/basic/components) example
- `use` (alias `plugins`) - list of plugins, see [Plugins](cypress/component/basic/plugins)
- `mixin` (alias `mixins`) - list of global mixins, see [Mixins](cypress/component/basic/mixins) example
- `filters` - hash of global filters, see [Filters](cypress/component/basic/filters) example

## Compatibility

| @cypress/vue2 | cypress |
| ------------- | ------- |
| >= v1         | >= v10  |

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
