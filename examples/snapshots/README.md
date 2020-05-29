# example: react-snapshots

> Component testing with snapshots using [cypress-plugin-snapshots](https://github.com/meinaart/cypress-plugin-snapshots)

Note: run `npm install` in this folder to symlink `cypress-react-unit-test` dependency.

```shell
npm install
npm run cy:open
# or just run headless tests
npm test
```

Example component taken from [Snapshot Testing React Components with Jest](https://semaphoreci.com/community/tutorials/snapshot-testing-react-components-with-jest)

![Snapshot test](images/snapshot-test.png)

See [cypress/component/PositiveCounter-spec.js](cypress/component/PositiveCounter-spec.js) and saved snapshots in [cypress/component/**snapshots**/](cypress/component/__snapshots__/PositiveCounter-spec.js.snap).

## Failing test

If the snapshot contents does not match the saved snapshot file, the test fails. You can click on the snapshot command, review the difference, and if the difference is expected, update the snapshot from the Test Runner's GUI.

![Update snapshot](images/update-snapshot.gif)
