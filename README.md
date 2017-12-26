# cypress-vue-unit-test

> A little helper to unit test Vue components in the Cypress.io E2E test runner

[![NPM][npm-icon] ][npm-url]

[![Build status][ci-image] ][ci-url]
[![semantic-release][semantic-image] ][semantic-url]
[![js-standard-style][standard-image]][standard-url]

## Install

Requires [Node](https://nodejs.org/en/) version 6 or above.

```sh
npm install --save-dev cypress-vue-unit-test
```

## Use

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
const mountVue = require('cypress-vue-unit-test')

/* eslint-env mocha */
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
  beforeEach(mountVue({ template, data }))

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
const mountVue = require('cypress-vue-unit-test')

/* eslint-env mocha */
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

  beforeEach(mountVue({ template, data }))

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
const mountVue = require('cypress-vue-unit-test')

/* eslint-env mocha */
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

  beforeEach(mountVue({ template, data, methods }))

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

### Component example

Let us test a complex example. Let us test a [single file Vue component](https://vuejs.org/v2/guide/single-file-components.html). Here is the [Hello.vue](Hello.vue) file

```
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

How do we load this Vue file into the testing code? Using [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress-webpack-preprocessor#readme) and [vue-loader](https://github.com/vuejs/vue-loader).
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
const mountVue = require('cypress-vue-unit-test')

/* eslint-env mocha */
describe('Hello.vue', () => {
  beforeEach(mountVue(Hello))

  it('shows hello', () => {
    cy.contains('Hello World!')
  })
})
```

Do you want to interact with the component? Full power! Do you want
to have multiple components? Sure!

```js
import Hello from '../../components/Hello.vue'
const mountVue = require('cypress-vue-unit-test')
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
  beforeEach(mountVue({ template, components }))

  it('greets the world 3 times', () => {
    cy.get('p').should('have.length', 3)
  })
})
```

[cypress.io]: https://www.cypress.io/

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
[ci-image]: https://travis-ci.org/bahmutov/cypress-vue-unit-test.svg?branch=master
[ci-url]: https://travis-ci.org/bahmutov/cypress-vue-unit-test
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
