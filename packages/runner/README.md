# Runner

![Runner](https://cloud.githubusercontent.com/assets/1157043/17947042/e9352ae2-6a18-11e6-85af-3670c7cfba03.png)

The runner is the minimal "chrome" around the user's app and has the following responsibilities:

- Managing communication between the driver, the reporter, the extension, and the server
- Managing the viewport size and scale
- Showing the currently active URL

## Developing

### Watching

This watches and compiles all changes as you make them.

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into single `dist/cypress_runner.js`
- Runs associated unit test of file saved and outputs to terminal
- Compiles `*.scss` files to single `dist/cypress_runner.css`
- Additionally it compiles both the [`reporter`](../reporter) and [`driver`](../driver)

```bash
yarn workspace @packages/runner watch
```

## Building

### For development

```bash
yarn workspace @packages/runner build
```

### For production

```bash
yarn workspace @packages/runner build-prod
```

## Testing

### Node Unit Tests

```bash
yarn workspace @packages/runner test
```

### Cypress Tests

You can run Cypress tests found in [`cypress/integration`](./cypress/integration):
```bash
yarn workspace @packages/runner cypress:open
```

To watch and reload changes to the runner while testing you'll want to run:
```bash
yarn workspace @packages/runner watch
```
