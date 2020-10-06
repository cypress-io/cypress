# Enzyme examples

This folder shows several examples from [Enzyme docs](https://enzymejs.github.io/enzyme/).

In general if you are migrating from Enzyme to `cypress-react-unit-test`:

- there is no shallow mounting, only the full mounting. Thus `cypress-react-unit-test` has `mount` which is similar to the Enzyme's `render`. It renders the full HTML and CSS output of your component. 
- you can mock [children components](https://github.com/bahmutov/cypress-react-unit-test/tree/main/cypress/component/advanced/mocking-component) if you want to avoid running "expensive" components during tests
- the test is running as a "mini" web application. Thus if you want to set a context around component, then set the [context around the component](https://github.com/bahmutov/cypress-react-unit-test/tree/main/cypress/component/advanced/context)

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

See [state-spec.js](state-spec.js) file.

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

See [props-spec.js](props-spec.js) file.

## context

Enzyme's `mount` method allows passing the [React context](https://reactjs.org/docs/context.html) as the second argument to the JSX component like `SimpleComponent` below.

```js
function SimpleComponent(props, context) {
  const { name } = context
  return <div>{name || 'not set'}</div>
}
```

Since the above syntax is [deprecated](https://reactjs.org/docs/legacy-context.html), `cypress-react-unit-test` does not support it. Instead use `createContext` and `Context.Provider` to surround the mounted component, just like you would do in a regular application code.

```js
mount(
  <SimpleContext.Provider value={{ name: 'test context' }}>
    <SimpleComponent />
  </SimpleContext.Provider>,
)
```

Instead of setting a new context, mount the same component but surround it with a different context provider

```js
const cmp = <SimpleComponent id="0x123" />
mount(
  <SimpleContext.Provider value={{ name: 'first context' }}>
    {cmp}
  </SimpleContext.Provider>,
)

// same component, different provider
mount(
  <SimpleContext.Provider value={{ name: 'second context' }}>
    {cmp}
  </SimpleContext.Provider>,
)
```

See [context-spec.js](context-spec.js) for more examples.
