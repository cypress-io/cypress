# Electron

This is the lib responsible for installing + building Electron. This enables us to develop with the Electron shell that will match how the final compiled Cypress binary looks 1:1.

It does this by using `symlinks` while in development.

## Building

```bash
yarn workspace @packages/electron build
```

Note: this just installs Electron binary for your OS specific platform

## Testing

```bash
yarn workspace @packages/electron test
yarn workspace @packages/electron test-debug
yarn workspace @packages/electron test-watch
```
