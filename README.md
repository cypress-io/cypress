# cypress-vue-unit-test

[![NPM][npm-icon] ][npm-url]

[![Build status][ci-image] ][ci-url]
[![Cypress dashboard][cypress-badge] ][cypress-dashboard]
[![semantic-release][semantic-image] ][semantic-url]
[![js-standard-style][standard-image]][standard-url]
[![renovate-app badge][renovate-badge]][renovate-app]

> A little helper to unit test Vue components in the open source [Cypress.io](https://www.cypress.io/) E2E test runner **v4.5.0+**

## TLDR

- What is this? This package allows you to use [Cypress](https://www.cypress.io/) test runner to unit test your Vue components with zero effort.

![Example component test](images/dynamic.gif)

- How is this different from [vue-test-utils](https://vue-test-utils.vuejs.org/en/)? Vue Test Utils uses Node, requires stubbing browser APIs, and requires users to await Vue's internal event loop. Cypress Vue Unit Test runs each component in the real browser with full power of Cypress E2E test runner: [live GUI, full API, screen recording, CI support, cross-platform](https://www.cypress.io/features/).

- If you like using `@testing-library/vue`, you can use `@testing-library/cypress` for the same `findBy`, `queryBy` commands, see one of the examples in the list below

## Install

<p align="center">
  <img src="./docs/commands.gif" width="400px" alt="Terminal typing vue add cypress-experimental"/>
</p>

* Requires Cypress v4.5.0 or later
* Requires [Node](https://nodejs.org/en/) version 8 or above
* Only supporting webpack-based projects
* Installation via Vue CLI recommended

### Vue CLI Installation
> Vue CLI v3+

*Recommended*: One step install to existing projects with Vue CLI via [experimental plugin](https://github.com/jessicasachs/vue-cli-plugin-cypress-experimental)

```sh
vue add cypress-experimental
```

### Manual Installation
> *Not Recommended*: All of this is done automatically with Vue CLI

1. Install `cypress` and `cypress-vue-unit-test`

```sh
npm install -D cypress cypress-vue-unit-test
```

2. Include this plugin `cypress/plugin/index.js`

```js
// default webpack file preprocessor is good for simple cases
// Required to temporarily patch async components, chunking, and inline image loading
import { onFileDefaultPreprocessor } from 'cypress-vue-unit-test/dist/preprocessor/webpack'

module.exports = on => {
  on('file:preprocessor', onFileDefaultPreprocessor)
}
```

3. Include the support file `cypress/support/index.js`

```js
import 'cypress-vue-unit-test/dist/support'
```

4. ⚠️ Turn the experimental component support on in your `cypress.json`. You can also specify where component spec files are located. For exampled to have them located in `src` folder use:

```json
{
  "experimentalComponentTesting": true,
  "componentFolder": "src"
}
```

## Usage and Examples

```js
// components/HelloWorld.spec.js
import { mount } from 'cypress-vue-unit-test'
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

See examples below for details.

<a name="global-vue-extensions"/>

### Global Vue Options

You can pass extensions (global components, mixins, modules to use)
when mounting Vue component. Use `{ extensions: { ... }}` object inside
the `options`.

* `components` - object of 'id' and components to register globally.

```js
// two different components, each gets "numbers" list
// into its property "messages"
const template = `
  <div>
    <message-list :messages="numbers"/>
    <a-list :messages="numbers"/>
  </div>
`
// our top level data
const data = () => ({ numbers: ['uno', 'dos'] })
// register same component globally under different names
const components = {
  'message-list': MessageList,
  'a-list': MessageList
}
// extend Vue with global components
const extensions = {
  components
}
beforeEach(mountCallback({ template, data }, { extensions }))
```

See [Vue component docs](https://vuejs.org/v2/api/#Vue-component),
[global-components-spec.js](cypress/integration/global-components-spec.js)

* `use` (alias `plugins`) - list of plugins

```js
const use = [MyPlugin]
// extend Vue with plugins
const extensions = {
  use
}
beforeEach(mountCallback({}, { extensions }))
```

See [Vue plugin docs](https://vuejs.org/v2/guide/plugins.html)
and [plugin-spec.js](cypress/integration/plugin-spec.js)

* `mixin` (alias `mixins`) - list of global mixins

```js
const MyMixin = {
  // we have to use original Sinon to create a spy
  // because we are outside a test function
  // and cannot use "cy.spy"
  created: Cypress.sinon.spy()
}
const mixin = [MyMixin]
// extend Vue with mixins
const extensions = {
  mixin
}
beforeEach(mountCallback({}, { extensions }))

it('calls mixin "created" method', () => {
  expect(MyMixin.created).to.have.been.calledOnce
})
```

See [Vue global mixin docs](https://vuejs.org/v2/guide/mixins.html#Global-Mixin)
and [mixin-spec.js](cypress/integration/mixin-spec.js)


* `filters` - hash of global filters

```js
const filters = {
  reverse: s => s.split().reverse().join()
}
// extend Vue with global filters
const extensions = {
  filters
}
beforeEach(mountCallback({}, { extensions }))
```

See [Vue global filters docs](https://vuejs.org/v2/api/#Vue-filter)
and [filters-spec.js](cypress/integration/filters-spec.js)


<a name="intro-example"/>

### The intro example

Take a look at the first Vue v2 example:
[Declarative Rendering](https://vuejs.org/v2/guide/#Declarative-Rendering).
The code is pretty simple

```html
<div id="app">
  {{ message }}
</div>
```
```js
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
})
```
It shows the message when running in the browser
```
Hello Vue!
```

Let's test it in [Cypress.io][cypress.io] (for the current version see
[cypress/integration/spec.js](cypress/integration/spec.js)).

```js
import { mountCallback } from 'cypress-vue-unit-test'

describe('Declarative rendering', () => {
  // Vue code from https://vuejs.org/v2/guide/#Declarative-Rendering
  const template = `
    <div id="app">
      {{ message }}
    </div>
  `

  const data = {
    message: 'Hello Vue!'
  }

  // that's all you need to do
  beforeEach(mountCallback({ template, data }))

  it('shows hello', () => {
    cy.contains('Hello Vue!')
  })

  it('changes message if data changes', () => {
    // mounted Vue instance is available under Cypress.vue
    Cypress.vue.message = 'Vue rocks!'
    cy.contains('Vue rocks!')
  })
})
```

Fire up Cypress test runner and have real browser (Electron, Chrome) load
Vue and mount your test code and be able to interact with the instance through
the reference `Cypress.vue.$data` and via GUI. The full power of the
[Cypress API](https://on.cypress.io/api) is available.

![Hello world tested](images/spec.png)

<a name="list-example"/>

### The list example

There is a list example next in the Vue docs.

```html
<div id="app-4">
  <ol>
    <li v-for="todo in todos">
      {{ todo.text }}
    </li>
  </ol>
</div>
```
```js
var app4 = new Vue({
  el: '#app-4',
  data: {
    todos: [
      { text: 'Learn JavaScript' },
      { text: 'Learn Vue' },
      { text: 'Build something awesome' }
    ]
  }
})
```

Let's test it. Simple.

```js
import { mountCallback } from 'cypress-vue-unit-test'

describe('Declarative rendering', () => {
  // List example from https://vuejs.org/v2/guide/#Declarative-Rendering
  const template = `
    <ol>
      <li v-for="todo in todos">
        {{ todo.text }}
      </li>
    </ol>
  `

  const data = {
    todos: [
      { text: 'Learn JavaScript' },
      { text: 'Learn Vue' },
      { text: 'Build something awesome' }
    ]
  }

  beforeEach(mountCallback({ template, data }))

  it('shows 3 items', () => {
    cy.get('li').should('have.length', 3)
  })

  it('can add an item', () => {
    Cypress.vue.todos.push({ text: 'Test using Cypress' })
    cy.get('li').should('have.length', 4)
  })
})
```

![List tested](images/list-spec.png)

<a name="handling-user-input"/>

### Handling User Input

The next section in the Vue docs starts with [reverse message example](https://vuejs.org/v2/guide/#Handling-User-Input).

```html
<div id="app-5">
  <p>{{ message }}</p>
  <button v-on:click="reverseMessage">Reverse Message</button>
</div>
```
```js
var app5 = new Vue({
  el: '#app-5',
  data: {
    message: 'Hello Vue.js!'
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }
})
```

We can write the test the same way

```js
import { mountCallback } from 'cypress-vue-unit-test'

describe('Handling User Input', () => {
  // Example from https://vuejs.org/v2/guide/#Handling-User-Input
  const template = `
    <div>
      <p>{{ message }}</p>
      <button v-on:click="reverseMessage">Reverse Message</button>
    </div>
  `

  const data = {
    message: 'Hello Vue.js!'
  }

  const methods = {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }

  beforeEach(mountCallback({ template, data, methods }))

  it('reverses text', () => {
    cy.contains('Hello Vue')
    cy.get('button').click()
    cy.contains('!sj.euV olleH')
  })
})
```

Take a look at the video of the test. When you hover over the `CLICK` step
the test runner is showing *before* and *after* DOM snapshots. Not only that,
the application is fully functioning, you can interact with the application
because it is really running!

![Reverse input](images/reverse-spec.gif)

<a name="component-example"/>

### Component example

Let us test a complex example. Let us test a [single file Vue component](https://vuejs.org/v2/guide/single-file-components.html). Here is the [Hello.vue](Hello.vue) file

```vue
<template>
  <p>{{ greeting }} World!</p>
</template>

<script>
export default {
  data () {
    return {
      greeting: 'Hello'
    }
  }
}
</script>

<style scoped>
p {
  font-size: 2em;
  text-align: center;
}
</style>
```

**note** to learn how to load Vue component files in Cypress, see
[Bundling](#bundling) section.

Do you want to interact with the component? Go ahead! Do you want
to have multiple components? No problem!

```js
import Hello from '../../components/Hello.vue'
import { mountCallback } from 'cypress-vue-unit-test'
describe('Several components', () => {
  const template = `
    <div>
      <hello></hello>
      <hello></hello>
      <hello></hello>
    </div>
  `
  const components = {
    hello: Hello
  }
  beforeEach(mountCallback({ template, components }))

  it('greets the world 3 times', () => {
    cy.get('p').should('have.length', 3)
  })
})
```

<a name="spying-example"/>

### Spying example

Button counter component is used in several Vue doc examples

```vue
<template>
  <button v-on:click="incrementCounter">{{ counter }}</button>
</template>

<script>
  export default {
    data () {
      return {
        counter: 0
      }
    },

    methods: {
      incrementCounter: function () {
        this.counter += 1
        this.$emit('increment')
      }
    }
  }
</script>

<style scoped>
button {
  margin: 5px 10px;
  padding: 5px 10px;
  border-radius: 3px;
}
</style>
```

Let us test it - how do we ensure the event is emitted when the button is clicked?
Simple - let us spy on the event, [spying and stubbing is built into Cypress](https://on.cypress.io/stubs-spies-and-clocks)

```js
import ButtonCounter from '../../components/ButtonCounter.vue'
import { mountCallback } from 'cypress-vue-unit-test'

describe('ButtonCounter', () => {
  beforeEach(mountCallback(ButtonCounter))

  it('starts with zero', () => {
    cy.contains('button', '0')
  })

  it('increments the counter on click', () => {
    cy.get('button').click().click().click().contains('3')
  })

  it('emits "increment" event on click', () => {
    const spy = cy.spy()
    Cypress.vue.$on('increment', spy)
    cy.get('button').click().click().then(() => {
      expect(spy).to.be.calledTwice
    })
  })
})
```

The component is really updating the counter in response to the click
and is emitting an event.

![Spying test](images/spy-spec.png)

[cypress.io]: https://www.cypress.io/

<a name="xhr-spying-stubbing"/>

### XHR spying and stubbing

The mount function automatically wraps XMLHttpRequest giving you an ability to intercept XHR requests your component might do. For full documentation see [Network Requests](https://on.cypress.io/network-requests). In this repo see [components/AjaxList.vue](components/AjaxList.vue) and the corresponding tests [cypress/integration/ajax-list-spec.js](cypress/integration/ajax-list-spec.js).

```js
// component use axios to get list of users
created() {
  axios.get(`https://jsonplaceholder.cypress.io/users?_limit=3`)
  .then(response => {
    // JSON responses are automatically parsed.
    this.users = response.data
  })
}
// test can observe, return mock data, delay and a lot more
beforeEach(mountCallback(AjaxList))
it('can inspect real data in XHR', () => {
  cy.server()
  cy.route('/users?_limit=3').as('users')
  cy.wait('@users').its('response.body').should('have.length', 3)
})
it('can display mock XHR response', () => {
  cy.server()
  const users = [{id: 1, name: 'foo'}]
  cy.route('GET', '/users?_limit=3', users).as('users')
  cy.get('li').should('have.length', 1)
    .first().contains('foo')
})
```

<a name="spying-window-alert"/>

### Spying on `window.alert`

Calls to `window.alert` are automatically recorded, but do not show up. Instead you can spy on them, see [AlertMessage.vue](components/AlertMessage.vue) and its test [cypress/integration/alert-spec.js](cypress/integration/alert-spec.js)


## Comparison

<!-- prettier-ignore-start -->
Feature | Vue Test Utils or @testing-library/vue | Cypress + `cypress-vue-unit-test`
--- | --- | ---
Test runs in real browser | ❌ | ✅
Uses full mount | ❌ | ✅
Test speed | 🏎 | as fast as the app works in the browser
Test can use additional plugins | maybe | use any [Cypress plugin](https://on.cypress.io/plugins)
Test can interact with component | synthetic limited API | use any [Cypress command](https://on.cypress.io/api)
Test can be debugged | via terminal and Node debugger | use browser DevTools
Built-in time traveling debugger | ❌ | Cypress time traveling debugger
Re-run tests on file or test change | ✅ | ✅
Test output on CI | terminal | terminal, screenshots, videos
Tests can be run in parallel | ✅ | ✅ via [parallelization](https://on.cypress.io/parallelization)
Test against interface | if using `@testing-library/vue` | ✅ and can use `@testing-library/cypress`
Spying and mocking | Jest mocks | Sinon library
Code coverage | ✅ | ✅
<!-- prettier-ignore-end -->

## Known problems

See issues labeled [v2](https://github.com/bahmutov/cypress-vue-unit-test/labels/v2)

<a name="bundling"/>

## Bundling

How do we load this Vue file into the testing code? Using webpack preprocessor. Note that this module ships with [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress-webpack-preprocessor#compatibility) 2.x that requires Webpack 4.x. If you have Webpack 3.x please add `@cypress/webpack-preprocessor v1.x`.

<a name="short-way"/>

### Short way

#### For Webpack Users
Your project probably already has `webpack.config.js` setup to transpile
`.vue` files. To load these files in the Cypress tests, grab the webpack
processor included in this module, and load it from the `cypress/plugins/index.js`
file.

```js
const {
  onFilePreprocessor
} = require('cypress-vue-unit-test/preprocessor/webpack')
module.exports = on => {
  on('file:preprocessor', onFilePreprocessor('../path/to/webpack.config'))
}
```

Cypress should be able to import `.vue` files in the tests

<a name="manual"/>

### Manual

Using [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress-webpack-preprocessor#readme) and [vue-loader](https://github.com/vuejs/vue-loader).
You can use [cypress/plugins/index.js](cypress/plugins/index.js) to load `.vue` files
using `vue-loader`.

```js
// cypress/plugins/index.js
const webpack = require('@cypress/webpack-preprocessor')
const webpackOptions = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
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
  vue-loader vue-template-compiler css-loader
```

And write a test

```js
import Hello from '../../components/Hello.vue'
import { mountCallback } from 'cypress-vue-unit-test'

describe('Hello.vue', () => {
  beforeEach(mountCallback(Hello))

  it('shows hello', () => {
    cy.contains('Hello World!')
  })
})
```

<a name="#development"/>

## Development

To see all local tests, install dependencies and open Cypress in GUI mode

```sh
npm install
npm run cy:open
```

<a name="#faq"/>

## FAQ

- If your component's static assets are not loading, you probably need
to start and proxy Webpack dev server. See [issue #4](https://github.com/bahmutov/cypress-vue-unit-test/issues/4)

<a name="#related"/>

## Related info

- [Testing Vue web applications with Vuex data store & REST backend](https://www.cypress.io/blog/2017/11/28/testing-vue-web-application-with-vuex-data-store-and-rest-backend/)
- [Why Cypress?](https://on.cypress.io/why-cypress)
- [Cypress API](https://on.cypress.io/api)
- [Learn TDD in Vue](https://learntdd.in/vue)
- [cypress-vue-unit-test vs vue-test-utils](https://codingitwrong.com/2018/03/04/comparing-vue-component-testing-tools.html)

<a name="#other"/>

## Test adapters for other frameworks

* [cypress-react-unit-test](https://github.com/bahmutov/cypress-react-unit-test)
* [cypress-cycle-unit-test](https://github.com/bahmutov/cypress-cycle-unit-test)
* [cypress-svelte-unit-test](https://github.com/bahmutov/cypress-svelte-unit-test)
* [cypress-angular-unit-test](https://github.com/bahmutov/cypress-angular-unit-test)
* [cypress-hyperapp-unit-test](https://github.com/bahmutov/cypress-hyperapp-unit-test)
* [cypress-angularjs-unit-test](https://github.com/bahmutov/cypress-angularjs-unit-test)

<a name="#contributors"/>

## Contributors

- [Amir Rustamzadeh](https://github.com/amirrustam)
- [Gleb Bahmutov](https://github.com/bahmutov)

### Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2017

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](https://glebbahmutov.com)
* [blog](https://glebbahmutov.com/blog)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/cypress-vue-unit-test/issues) on Github

## MIT License

Copyright (c) 2017 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[npm-icon]: https://nodei.co/npm/cypress-vue-unit-test.svg?downloads=true
[npm-url]: https://npmjs.org/package/cypress-vue-unit-test
[ci-image]: https://circleci.com/gh/bahmutov/cypress-vue-unit-test/tree/master.svg?style=svg
[ci-url]: https://circleci.com/gh/bahmutov/cypress-vue-unit-test/tree/master
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
[cypress-badge]: https://img.shields.io/badge/cypress.io-tests-green.svg?style=flat-square
[cypress-dashboard]: https://dashboard.cypress.io/#/projects/134ej7
[renovate-badge]: https://img.shields.io/badge/renovate-app-blue.svg
[renovate-app]: https://renovateapp.com/
