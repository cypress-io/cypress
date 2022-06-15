# example: mount the component inside before hook

Typically we advise to mount the component inside the test or inside the `beforeEach` hook

```js
// mount the component inside the test
it('does something', () => {
  mount(...)
})
// mount the component before each test
describe('component', () => {
  beforeEach(() => {
    mount(...)
  })
  it('works 1', () => {
    ...
  })
  it('works 2', () => {
    ...
  })
})
```

This example shows that we can mount the component once and then run tests against it

```js
before(() => {
  mount(...)
})
it('works 1', () => {
  ...
})
it('works 2', () => {
  ...
})
```

See [spec.js](spec.js)
