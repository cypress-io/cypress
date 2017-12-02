# Electron

This is the lib responsible for installing + building Electron. This enables us to develop with the Electron shell that will match how the final compiled Cypress binary looks 1:1.

It does this by using `symlinks` while in development.

## Install

The Desktop GUI's dependencies can be installed with:

```bash
cd packages/desktop-gui
npm install
```

## Building

```bash
npm run build
```

Note: `npm run build` just installs Electron binary for your OS specific platform
