# Enzyme examples

This folder shows several examples from [Enzyme docs](https://enzymejs.github.io/enzyme/). Find the tests in the [spec.js](spec.js) file.

## setState

If you want to change the component's internal state, use the component reference. You can get it by using the special property `ref` when mounting.

```js
// get the component reference using "ref" prop
// and place it into the object for Cypress to "wait" for it
let c = {}
mount(<Foo id="foo" foo="initial" ref={i => (c.instance = i)} />)
cy.wrap(c)
  .its('instance')
  .invoke('setState', { count: 10 })
```

## setProps

There is no direct implementation of `setProps`. If you want to see how the component behaves with different props:

```js
it('mounts component with new props', () => {
  mount(<Foo id="foo" foo="initial" />)
  cy.contains('initial').should('be.visible')

  mount(<Foo id="foo" foo="second" />)
  cy.contains('second').should('be.visible')
})
```

If you want to reuse properties, you can even clone the component

```js
it('mounts cloned component', () => {
  const cmp = <Foo id="foo" foo="initial" />
  mount(cmp)
  cy.contains('initial').should('be.visible')

  const cloned = Cypress._.cloneDeep(cmp)
  // change a property, leaving the rest unchanged
  cloned.props.foo = 'second'
  mount(cloned)
  cy.contains('.foo', 'second').should('be.visible')
})
```
