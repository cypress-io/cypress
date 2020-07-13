# mocking axios

**Help wanted [#346](https://github.com/bahmutov/cypress-vue-unit-test/issues/346)**

How can `import ... from '...'` be mocked from Vue and from JS spec files if the import is from `node_modules`? In plain JS files we use '@babel/plugin-transform-modules-commonjs' plugin so that all imports from file X are the same object and the individual properties can be stubbed using `cy.stub(X, 'import name')`. But the `vue-loader` used to transpile Vue files seems to not allow additional Babel plugins?

See [mock-get-spec.js](mock-get-spec.js) and [AxiosGet.vue](AxiosGet.vue) for an open problem.

## Workaround

As a good workaround in this case, you can use an intermediate CommonJS wrapper module, like [AxiosApi.js](AxiosApi.js) that re-experts the CommonJS module; you can then mock those exports.

```js
// AxiosApi.js
export * from 'axios'
```

[Users.vue](Users.vue) shows the component that imports from `AxiosApi.js`

```js
import { get } from './AxiosApi'
```

The test [mock-axios-wrapper-spec.js](mock-axios-wrapper-spec.js) mocks the "get" import.

```js
import Users from './Users.vue'
import * as AxiosApi from './AxiosApi'

cy.stub(AxiosApi, 'get')
  .resolves({
    data: [
      {
        id: 101,
        name: 'Test User',
      },
    ],
  })
  .as('get')

mount(Users)
```

![Mocking axios wrapper exports](./images/wrapper.png)
