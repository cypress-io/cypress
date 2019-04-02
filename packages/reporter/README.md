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

## Installing

The reporter's dependencies can be installed with:

```bash
cd packages/reporter
npm install
```

The reporter may also require that dependencies by installed at the root of this repository:

```bash
npm install
```

## Building

### For development

```bash
npm run build
```

### For production

```bash
npm run build-prod
```

## Developing

To see the reporter render, see [Developing the driver](../driver/README.md#Developing).

### Watching

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into single `dist/reporter.js`
- Runs associated unit test of file saved and outputs to terminal
- Compiles `*.scss` files to single `dist/reporter.css`

```bash
npm run watch
```

## Testing

### Cypress

Run Cypress tests found in `cypress/integration`. 

```bash
npm run cypress:open
```

You'll want to run `npm run watch` in the `packages/reporter` to iterate on the reporter under test while testing.

You'll want to run `npm run watch` in the `packages/runner` to get changes to the main Cypress reporter while testing.

### Enzyme

Run enzyme component tests found in `*.spec` files in `src`:

```bash
npm test
```

