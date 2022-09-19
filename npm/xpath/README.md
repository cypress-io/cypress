# @cypress/xpath

> Adds XPath command to [Cypress.io](https://www.cypress.io) test runner

## Install with npm

```shell
npm install -D @cypress/xpath
```

## Install with Yarn

```shell
yarn add @cypress/xpath --dev
```

Then include in your project's [support file](https://on.cypress.io/support-file)

```js
require('@cypress/xpath');
```

## Use

After installation your `cy` object will have `xpath` command.

```js
it('finds list items', () => {
  cy.xpath('//ul[@class="todo-list"]//li').should('have.length', 3);
});
```

You can also chain `xpath` off of another command.

```js
it('finds list items', () => {
  cy.xpath('//ul[@class="todo-list"]').xpath('./li').should('have.length', 3);
});
```

As with other cy commands, it is scoped by `cy.within()`.

```js
it('finds list items', () => {
  cy.xpath('//ul[@class="todo-list"]').within(() => {
    cy.xpath('./li').should('have.length', 3);
  });
});
```

**note:** you can test XPath expressions from DevTools console using `$x(...)` function, for example `$x('//div')` to find all divs.

See [cypress/e2e/spec.cy.js](cypress/e2e/spec.cy.js)

## Beware the XPath // trap

In XPath the expression // means something very specific, and it might not be what you think. Contrary to common belief, // means "anywhere in the document" not "anywhere in the current context". As an example:

```js
cy.xpath('//body').xpath('//script');
```

You might expect this to find all script tags in the body, but actually, it finds all script tags in the entire document, not only those in the body! What you're looking for is the .// expression which means "any descendant of the current node":

```js
cy.xpath('//body').xpath('.//script');
```

The same thing goes for within:

```js
cy.xpath('//body').within(() => {
  cy.xpath('.//script');
});
```


For more, see [Intelligent Code Completion](https://on.cypress.io/intellisense)

## License

This project is licensed under the terms of the [MIT license](/LICENSE.md).
