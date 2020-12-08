# Access the component

If you need to access the mounted component from test, a reference is available at `Cypress.vue` after the `mount` finishes (asynchronously).

```js
mount(...)
.then(() => {
  Cypress.vue.<prop> = ...
  // or call a method
  Cypress.vue.<method()
})
// then check the UI
cy.contains(...)
```

See component [Message.vue](Message.vue) and [message-spec.js](message-spec.js)
