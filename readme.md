## Cypress Gui

This repository contains the source code for the Cypress Desktop App Gui.

## Installing

```bash
npm install
```

## Developing

#### Linking Local Changes

If you want to modify src files or branch and want to see those changes take effect you need to link `cypress-gui` with `cypress-server`:

```bash
## make sure node version is same
## as cypress-server
node -v
cd ../cypress_server
node -v
```

```bash
## link up node_modules
npm link
cd ../cypress-server
npm link cypress-gui
```

#### Building `/src`

```bash
## build and watch /src files
npm run dev
```

## Testing

```bash
npm test

## using cypress to test cypress files? YAP!
npm run cypress
```
