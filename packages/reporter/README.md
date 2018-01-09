# Reporter

![Reporter](https://cloud.githubusercontent.com/assets/1157043/17947006/bffba412-6a18-11e6-86ee-af7e9c9d614e.png)

The reporter shows the running results of the tests. It includes the following:

- A button to focus the list of test files
- Stats for number of tests passed, failed, and pending
- The total test run duration
- Control for toggling auto-scrolling
- Controls for various states (running, paused, stopped, etc.)
- A command log, showing:
  * suites
  * tests
  * hooks
  * commands and assertions with detailed information
  * any failures/errors
- Toggle-able auto-scrolling of command log

## Install

The reporters's dependencies can be installed with:

```bash
cd packages/reporter
npm install
```

## Development

### Watching

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into single `dist/reporter.js`
- Runs associated unit test of file saved and outputs to terminal
- Compiles `*.scss` files to single `dist/reporter.css`

```bash
npm run watch
```

### One Time Building

#### For development

```bash
npm run build-dev
```

#### For production

```bash
npm run build-prod
```

## Testing

```bash
npm test
```
