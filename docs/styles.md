# styles

If you component imports its own style, the style should be applied during the Cypress test. But sometimes you need more power.

You can 3 options to load additional styles:

```js
mount(<Component />, {
  style: string, // load inline style CSS
  cssFiles: string | string[], // load a single or a list of local CSS files
  stylesheets: string | string[] // load external stylesheets
})
```

## Inline styles

You can add individual style to the mounted component by passing its text as an option

```js
it('can be passed as an option', () => {
  const style = `
    .component-button {
      display: inline-flex;
      width: 25%;
      flex: 1 0 auto;
    }

    .component-button.orange button {
      background-color: #F5923E;
      color: white;
    }
  `
  cy.mount(<Button name="Orange" orange />, { style })
  cy.get('.orange button').should(
    'have.css',
    'background-color',
    'rgb(245, 146, 62)',
  )
})
```

## Load local CSS file

```js
const cssFiles = 'cypress/integration/Button.css'
cy.mount(<Button name="Orange" orange />, { cssFiles })
```

See [cypress/integration/inject-style-spec.js](cypress/integration/inject-style-spec.js) for more examples.

## Load external stylesheets

```js
mount(<Todo todo={todo} />, {
  stylesheets: [
    'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
  ],
})
```
