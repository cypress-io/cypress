# Cypress Core Electron

This is a shared lib for Cypress which manages installing + building the Cypress Electron application.

It is a simple wrapper that `symlinks` while in development.

## Install

Root install is preferred (see `CONTRIBUTING.md`), but if you must

* `npm install`
* `npm run build`

Note: `npm run build` just installs Electron binary for this platform
