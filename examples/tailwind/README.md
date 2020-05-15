# example: tailwind

Component testing when using [Tailwind CSS](https://tailwindcss.com/), example created following the blog post [Using Tailwind CSS With React](https://medium.com/codingthesmartway-com-blog/using-tailwind-css-with-react-ced163d0e9e9) and Tailwind's own documentation.

## Installation

Run `npm install` in this folder to symlink `cypress-react-unit-test` dependency first.

```shell
npm install
```

## Run tests

You can execute `npm run build:css` to let Tailwind generate `src/styles/main.generated.css` or run Cypress, since this step is set as a pre-test step inside [package.json](package.json).

```shell
npm run cy:open
# or just run headless tests
npm test
```

## Tests

- [src/App.cy-spec.js](src/App.cy-spec.js) tests component [src/App.js](src/App.js) that uses Tailwind style bundle `src/styles/main.generated.css`

![Tailwind test](./images/tailwind.png)

- [src/playground.cy-spec.js](src/playground.cy-spec.js) imports the CSS directly and shows off different available classes, allowing you to experiment with them from the test

![Playground](images/playground.png)

Note: each test uses [cy.screenshot](https://on.cypress.io/screenshot) at the end to save an image to `cypress/screenshots` folder.

## See also

When working with styles, we recommend [visual testing](https://on.cypress.io/visual-testing) using one of 3rd party [visual plugins](https://on.cypress.io/plugins#visual-testing). See a few visual testing examples in this repository.
