# Runner

![Runner](https://cloud.githubusercontent.com/assets/1157043/17947042/e9352ae2-6a18-11e6-85af-3670c7cfba03.png)

The runner is the minimal "chrome" around the user's app and has the following responsibilities:

- Managing communication between the driver, the reporter, the extension, and the server
- Managing the viewport size and scale
- Showing the currently active URL

## Install

The runner's dependencies can be installed with:

```bash
cd packages/runner
npm install
```

## Development

### Watching

This watches and compiles all changes as you make them.

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into single `dist/cypress_runner.js`
- Runs associated unit test of file saved and outputs to terminal
- Compiles `*.scss` files to single `dist/cypress_runner.css`
- Additionally it compiles both the [`reporter`](../reporter) and [`driver`](../driver)

```bash
npm run watch
```

### One Time Build

#### For development

```bash
npm run build
```

#### For production

```bash
npm run build-prod
```

## Testing

```bash
npm test
```
