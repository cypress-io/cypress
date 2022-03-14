# example: a11y

> Testing component accessibility

## Example

Testing components following the [React accessibility guide](https://reactjs.org/docs/accessibility.html) using [cypress-axe](https://github.com/avanslaars/cypress-axe) plugin.

See the spec file [src/failing.cy.jsx](src/failing.cy.jsx). For example, an `<input>` without a label is caught:

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
