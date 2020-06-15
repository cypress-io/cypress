# Extension

This is the WebExtension responsible for automating the browser

## Developing

### Watching

```bash
yarn workspace @packages/extension watch
```

## Building

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
2. Go into Extensions
3. Check **Developer Mode**
4. Click **Load unpacked extension...**
5. Choose **packages/extension/dist** directory
6. Click **background page** to debug `background.js`
7. Click **Reload (⌘R)** to pull in changes to `manifest.json`

### In Firefox

To be written...
