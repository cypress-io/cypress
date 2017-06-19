# cypress

> Testing the way it should be

## Install

Requires Node version >= 0.12

```sh
npm install --save-dev cypress
```

## Open Cypress desktop GUI application

To open Cypress app, there are two alternatives from the
command line

```sh
./node_modules/.bin/cypress open
$(npm bin)/cypress open
```

or you can add new a script to your `package.json`

```json
{
  "scripts": {
    "open": "cypress open"
  }
}
```

and then call `npm run open`

## Run tests

To run e2e tests in headless mode execute `$(npm bin)/cypress run`

## Load Cypress as an NPM module

```js
const cy = require('cypress')
// opens desktop GUI application and returns a promise
cy.open(options)
// runs e2e tests in headless browser
// and returns a promise with test results
cy.run(options).then(results, console.error)
```
