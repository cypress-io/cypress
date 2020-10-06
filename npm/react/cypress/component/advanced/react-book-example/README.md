App and tests modeled from https://github.com/softchris/react-book/tree/7bd767bb39f59977b107d07f383a8f4e32a12857/Testing/test-demo for https://softchris.github.io/books/react/

## Selecting React Components

Typically we suggest selecting DOM elements using public properties likes data attributes, labels, text, CSS class names, or ids. If you really want to select React components using props or state values, combine `cypress-react-unit-test` with [cypress-react-selector](https://github.com/abhinaba-ghosh/cypress-react-selector) plugin.

See file [./src/components/ProductsList.spec.js](./src/components/ProductsList.spec.js) for example.

```js
// find a single instance with prop
// <AProduct name={'Second item'} />
cy.react('AProduct', { name: 'Second item' })
  .should('be.visible')
  .and('have.text', 'Second item')
```
