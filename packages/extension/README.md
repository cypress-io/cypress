# Extension

This is the WebExtension responsible for automating the browser

## Developing

### Watching

```bash
yarn lerna run watch --scope @packages/extension --stream
```

## Building

```bash
yarn lerna run build --scope @packages/extension --stream
```

## Testing

```bash
yarn lerna run test --scope @packages/extension --stream
yarn lerna run test-watch --scope @packages/extension --stream
yarn lerna run test-debug --scope @packages/extension --stream
```

## Debugging

### In Chrome

1. Open Chrome
2. Go into Extensions
3. Check **Developer Mode**
4. Click **Load unpacked extension...**
5. Choose **packages/extension/dist** directory
6. Click **background page** to debug `background.js`
7. Click **Reload (⌘R)** to pull in changes to `manifest.json`

### In Firefox

To be written...
