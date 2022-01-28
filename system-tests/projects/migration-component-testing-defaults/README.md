A component tesing project without e2e, and all defaults for CT. We rename their specs for them in step 1, then we ask them to move them in step 2.

Steps:

- [x] automatic file rename
- [x] manual file rename
- [ ] rename support
- [ ] update config file
- [x] setup component testing

Output:

```js
module.exports = {
  component: {
    supportFile: false,
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')
    },
    specPattern: "**/*.cy.{js,jsx,ts,tsx}"
  }
}
```
