# Cypress packages/extension

> Chrome Extension for loading our testing code into the browser

## Install

Root install is preferred (see `CONTRIBUTING.md`), but if you must

* `npm install`
* `npm run build
## Developing

### Building

```bash
npm run build-prod
```

### Watching

```bash
npm run watch-dev
```

### Testing

```bash
npm run test
```

1. Open Chrome
2. Go into Extensions
3. Check **Developer Mode**
4. Click **Load unpacked extension...**
5. Choose **cypress-core-extension/dist** directory
6. Click **background page** to debug `background.js`
7. Click **Reload (⌘R)** to pull in changes to `manifest.json`
