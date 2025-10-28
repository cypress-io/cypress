# Extension

This is the WebExtension responsible for automating the browser

## Developing

### Watching

Kicks off the gulp watcher that rebuilds the app/lib directories on change.

```bash
yarn workspace @packages/extension watch
```

## Building

`@packages/extension` has a few different build processes occurring that are all driven by the [`gulpfile`](./gulpfile.ts).
* `app` - The web extension piece of the code, has two separate bundles:
    * `v2`: Version 2 of the web extension which uses [webpack](./webpack.config.mjs) to bundle the `app/v2` directory and output it as `background.js`
    * `v3`: Version 3 of the web extension, which doesn't have any external dependencies so we are able to compile down to `ESM to run in the browser natively.
* `lib` - the `@packages/extension` `main` entry that has utility methods on how to find/load the extension. This is transpiled to CommonJS as it is consumed in the Node context.

```bash
yarn workspace @packages/extension build
```

## Testing

```bash
yarn workspace @packages/extension test
yarn workspace @packages/extension test-watch
yarn workspace @packages/extension test-debug
```

## Debugging

### In Chrome

1. Open Chrome
2. Go into Extensions (`chrome://extensions`)
3. Check **Developer Mode** (top right of screen)
4. Click **Load unpacked extension...** (top left of screen)
5. Choose **packages/extension/dist** directory (v2)
6. Click **background page** to debug `background.js` (inspect views `background page`)
7. Click **Reload (⌘R)** to pull in changes to `manifest.json`

### In Firefox

1. Launch Firefox via `cypress open`.
2. Once Firefox is open, open an new tab and navigate to `about:debugging`.
3. Click the `This Firefox` navigation item on the left hand navigation pane and locate the `Cypress` extension under `Temporary Extensions`.
4. Click `inspect`. A console window should now appear in a separate window.
5. Close the `about:debugging` tab.
6. In the newly spawned console window, you should be able to see `background.js` in the `Debugger` tab.
7. Set breakpoints as needed to inspect what code you are trying to debug. Happy debugging!
