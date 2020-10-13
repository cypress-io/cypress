# example: a11y

> Testing component accessibility

## Usage

1. Make sure the root project has been built .

```bash
# in the root of the project
npm install
npm run build
```

2. Run `npm install` in this folder to symlink the `cypress-react-unit-test` dependency.

```bash
# in this folder
npm install
```

3. Start Cypress

```bash
npm run cy:open
# or just run headless tests
npm test
```

## Example

Testing components following the [React accessibility guide](https://reactjs.org/docs/accessibility.html) using [cypress-axe](https://github.com/avanslaars/cypress-axe) plugin.

See the spec file [cypress/component/spec.js](cypress/component/spec.js). For example, an `<input>` without a label is caught:

```js
mount(<input type="text" value="John Smith" name="name" />)
cy.checkA11y('input', {
  runOnly: {
    type: 'tag',
    values: ['wcag2a'],
  },
})
```

![Input without a label](images/missing-label.png)

You can click on the error to see more details in the DevTools console

![Error details](images/label-error.png)
