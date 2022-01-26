An e2e project with a custom testFiles but default integrationFolder. We won't rename the specs, but we will rename `integration` to `e2e`.

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
    specPattern: "cypress/e2e/**/*.test.js"
  }
}
```
