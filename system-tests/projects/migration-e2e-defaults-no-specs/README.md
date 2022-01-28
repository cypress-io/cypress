An e2e project with all defaults, but no spec files. We should not show the auto rename step - nothing to rename.

Steps:

- [ ] automatic file rename
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
  }
}
```
