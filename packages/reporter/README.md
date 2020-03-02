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
- Toggle-able auto-scrolling of command log

## Building

### For development

```bash
yarn lerna run build --scope @packages/reporter --stream
```

### For production

```bash
yarn lerna run build-prod --scope @packages/reporter --stream
```

## Developing

To see the reporter render, see [Developing the driver](../driver/README.md#Developing).

### Watching

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into single `dist/reporter.js`
- Runs associated unit test of file saved and outputs to terminal
- Compiles `*.scss` files to single `dist/reporter.css`

```bash
yarn lerna run watch --scope @packages/reporter --stream
```

## Testing

### Cypress

Run Cypress tests found in `cypress/integration`.

```bash
yarn lerna run cypress:open --scope @packages/reporter --stream
```

You'll want to run `yarn lerna run watch --scope @packages/reporter --stream` to iterate on the reporter under test while testing.

You'll want to run `yarn lerna run watch --scope @packages/runner --stream` to get changes to the main Cypress reporter while testing.

### Enzyme

Run enzyme component tests found in `*.spec` files in `src`:

```bash
yarn lerna run test --scope @packages/reporter --stream
```

