# use-babelrc

> Transpiling specs using local .babelrc file

The [cypress/integration/spec.js](cypress/integration/spec.js) uses null coalescing operator `??`, which needs a [separate plugin](https://babeljs.io/docs/en/next/babel-plugin-proposal-nullish-coalescing-operator) for Babel to transpile it.

```js
it('handles nullish operator', () => {
  const data = {
    person: {
      firstName: 'Joe'
    }
  }
  const name = data.person.firstName ?? 'Anonymous'
  expect(name).to.equal('Joe')
})
```

There is a local [.babelrc](.babelrc) file, and to make Cypress preprocessor use it, the [cypress/plugins/index.js](cypress/plugins/index.js) removes Babel presets from the default options.
