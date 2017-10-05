# Cypress Core Runner

![Runner](https://cloud.githubusercontent.com/assets/1157043/17947042/e9352ae2-6a18-11e6-85af-3670c7cfba03.png)

The runner is the minimal "chrome" around the user's app and has the following responsibilities:

- Managing communication between the driver, the reporter, the extension, and the server
- Managing the viewport size and scale
- Showing the currently active URL

## Install

Root install is preferred (see `CONTRIBUTING.md`), but if you must

* `npm install`

## Development

### Building

#### For development

```bash
npm run build
```

#### For production

```bash
npm run build-prod
```

### Watching

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into single `dist/runner.js`
- Runs associated unit test of file saved and outputs to terminal
- Compiles `*.scss` files to single `dist/runner.css`

```bash
npm run watch
```

### Testing

```bash
npm test
```
