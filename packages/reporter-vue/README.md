# Reporter

![Reporter](https://cloud.githubusercontent.com/assets/1157043/17947006/bffba412-6a18-11e6-86ee-af7e9c9d614e.png)

The reporter shows the running results of the tests. It includes the following:

- A button to focus the list of test files
- Stats for number of tests passed, failed, and pending
- The total test run duration
- Control for toggling auto-scrolling
- Controls for various states (running, paused, stopped, etc.)
- A command log, showing:
  - suites
  - tests
  - hooks
  - commands and assertions with detailed information
  - any failures/errors

## Building

### For development

```bash
yarn workspace @packages/reporter build
```

### For production

```bash
yarn workspace @packages/reporter build-prod
```

## Developing

To see the reporter render, see [Developing the driver](../driver/README.md#Developing).

### Watching

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into single `dist/reporter.js`
- Compiles `*.scss` files to single `dist/reporter.css`

```bash
yarn workspace @packages/reporter watch
```

## Testing

Run Cypress tests found in `cypress/integration`.

```bash
yarn workspace @packages/reporter cypress:open
```

You'll want to run `yarn workspace @packages/reporter watch` to iterate on the reporter under test while testing.

You'll want to run `yarn workspace @packages/runner watch` to get changes to the main Cypress reporter while testing.
