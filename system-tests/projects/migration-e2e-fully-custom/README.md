A fully custom project for migration.

Steps:

- [ ] automatic file rename
- [ ] manual file rename
- [ ] rename support
- [x] update config file
- [ ] setup component testing

Output:

```js
module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      return require('./src/the-plugin-file.js')
    },
    specPattern: "src/somewhere/**/*.spec.js"
    supportFile: "src/some/support.js"
  }
}
```
