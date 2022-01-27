An e2e project with a custom integrationFolder but default spec pattern. We will rename the specs to use `.cy.js`, but keep the custom integrationFolder.

Steps:

- [x] automatic file rename
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [ ] setup component testing

Output:

```js
module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')
    },
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}"
  }
}
```
