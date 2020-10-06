# styles

If you component imports its own style, the style should be applied during the Cypress test. But sometimes you need more power.

You can 3 options to load additional styles:

```js
const myComponent = {
  template: '<button class="orange"><slot/></button>'
}

mount(myComponent, {
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
  const myComponent = {
    template: '<button class="orange"><slot/></button>'
  }

  mount(myComponent, { style })
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
const myComponent = {
  template: '<button class="orange"><slot/></button>'
}
mount(myComponent, { cssFiles })
```

## Load external stylesheets

```js
const myComponent = {
  template: '<button class="orange"><slot/></button>'
}
mount(myComponent, {
  stylesheets: [
    'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
  ],
})
```
