A component tesing project without e2e. We ask the users to migrate their specs manually. `supportFile` is `false`.

Steps:

- [ ] automatic file rename
- [x] manual file rename
- [ ] rename support
- [x] update config file
- [x] setup component testing

Output:

```js
module.exports = {
  component: {
    supportFile: false,
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')
    },
    specPattern: "src/**/*.cy.{js,tsx}"
  }
}
```
