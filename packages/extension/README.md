# Extension

This is the Chrome Extension responsible for automating Chrome

## Install

The extension's dependencies can be installed with:

```bash
cd packages/extension
npm install
```

## Developing

### Watching

```bash
npm run watch
```

### One Time Building

```bash
npm run build
```

## Testing

```bash
npm run test
```

## Debugging

1. Open Chrome
2. Go into Extensions
3. Check **Developer Mode**
4. Click **Load unpacked extension...**
5. Choose **packages/extension/dist** directory
6. Click **background page** to debug `background.js`
7. Click **Reload (⌘R)** to pull in changes to `manifest.json`
