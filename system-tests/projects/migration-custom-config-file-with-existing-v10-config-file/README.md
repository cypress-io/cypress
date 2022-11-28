## Migration Custom Config File Root Level

This is the "kitchen sink" of migrations. It has E2E and a custom config file which 
lives in the root of the project and also there's a v10 config file, creating legacy
config conflicts

The following migration steps will be used during this migration:

- [x] automatic folder rename of cypress/integration to cypress/e2e
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [] setup component testing

