# Electron

This is the lib responsible for installing + building Electron. This enables us to develop with the Electron shell that will match how the final compiled Cypress binary looks 1:1.

It does this by using `symlinks` while in development.

## Building

```bash
yarn lerna run build --scope @packages/electron --stream
```

Note: this just installs Electron binary for your OS specific platform

## Testing

```bash
yarn lerna run test --scope @packages/electron --stream
yarn lerna run test-debug --scope @packages/electron --stream
yarn lerna run test-watch --scope @packages/electron --stream
```
