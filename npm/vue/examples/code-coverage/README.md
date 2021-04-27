# cypress-ct-example-vue-code-coverage

Example Cypress component testing with code coverage

Uses [@cypress/code-coverage](https://github.com/cypress-io/code-coverage) plugin for [Cypress.io](https://www.cypress.io) test runner. See [https://on.cypress.io/code-coverage](https://on.cypress.io/code-coverage) documentation.

## Disclaimer

This package is meant to run within the cypress monorepo.
If you copy this project out of the Cypress monorepo, It will work.
Do not forget to replace the cypress commands in the `package.json` scripts:

- Open `package.json`
- find the `test` and `cy:open` scripts
- In those scripts, replace `node ../../../../scripts/cypress` by only `cypress`

You should obtain 

```diff
{
  "scripts":{
-    "cy:open": "node ../../../../scripts/cypress open-ct",
+    "cy:open": "cypress open-ct",
-    "test": "node ../../../../scripts/cypress run-ct"
+    "test": "cypress run-ct"
  }
}
```

## Add coverage to component testing

- Install dependencies
  `yarn add -D babel-plugin-istanbul @cypress/code-coverage`
- Add the istanbul plugin to your `.babelrc`
- Install `@cypress/code-coverage/task` in `cypress/plugins/index.js`
- Install `@cypress/code-coverage/support` in `cypress/support/index.js`
- Enjoy

