This is the "kitchen sink" of migrations. It has E2E and Component Testing, a bunch of specs, and requires all the steps.

Steps:

- [x] automatic folder rename of cypress/integration to cypress/e2e
- [x] manual file rename
- [x] rename support
- [x] update config file
- [x] setup component testing

Output:

```js
module.exports = {
  retries: 2,
  baseUrl: "http://localhost:3000",
  defaultCommandTimeout: 5000,
  fixturesFolder: false,
  component: {
    specPattern: "src/**/*.spec.{tsx.js}",
    slowTestThreshold: 5000,
    retries: 1
  },
  e2e: {
    defaultCommandTimeout: 10000,
    slowTestThreshold: 5000
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')
    },
  }
}
```
