Can we mock an import used in the component under test?

See [sinon.js discussion](https://github.com/sinonjs/sinon/issues/1121)

## Solution

In babel configuration file, add one more plugin

```js
// https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs
// loose ES6 modules allow us to dynamically mock imports during tests
;[
  '@babel/plugin-transform-modules-commonjs',
  {
    loose: true,
  },
]
```

The ES6 exports and imports then will be a plain object then

```js
// when loose: true
// each ES6 export is made using plain objet
var exports = { foo: 'bar' }
// which we can overwrite later

// when loose: false
// each ES6 export is made using
// Object.defineProperty(exports, { value: ..., configurable: false })
// which we cannot change
```

We can overwrite a property like this

```js
// component imports and uses greeting
// like this
// import {greeting} from './greeting'
import Component from './component'
import * as GreetingModule from './greeting'
it('shows mock greeting', () => {
  // stub property on the loaded ES6 module using cy.stub
  // which will be restored after the test automatically
  cy.stub(GreetingModule, 'greeting', 'test greeting')
  mount(<Component />)
  cy.contains('h1', 'test greeting').should('be.visible')
})
```

## PizzaProps

If the component is using `defaultProps` to pass a method to call, you can stub it, see [PizzaProps.js](PizzaProps.js) and [PizzaProps.spec.js](PizzaProps.spec.js)

```js
import PizzaProps from './PizzaProps'
cy.stub(PizzaProps.defaultProps, 'fetchIngredients').resolves(...)
```

## RemotePizza

Even if the import is renamed, you can stub using the original name, see [RemotePizza.js](RemotePizza.js) and [RemotePizza.spec.js](RemotePizza.spec.js)

```js
// RemotePizza.js
import { fetchIngredients as defaultFetchIngredients } from './services'
// RemotePizza.spec.js
import * as services from './services'
cy.stub(services, 'fetchIngredients').resolves(...)
```
