# Mocking axios

Axios is installed in `node_modules` and used from Vue components.

## Default export (`axios.get`)

HTTP helpers live on the default export. Import the default and call `axios.get`, then stub that method on the same module instance your spec imports.

```js
// component code
import axios from 'axios'
axios.get('...').then(...)

// spec file: import the default and stub .get
import Axios from 'axios'

cy.stub(Axios, 'get').resolves({
  data: [
    {
      id: 101,
      name: 'Test User',
    },
  ],
})
```

![Mocked get](./images/mock-get.png)

See [Users.vue](Users.vue) and [Users.cy.js](Users.cy.js).
