## Cypress Gui

This repository contains the source code for the Cypress Desktop App Gui.

## Installing

```bash
npm install

## post install it will automatically
## build the files into ./dist
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

#### Building `/dist`

```bash
## build and watch /src files
npm run dev
```

#### One off build
```bash
npm run build
```

## Testing

```bash
npm test
```

This will watch your files and run the gui in port `6060`.

## Debugging
If you want to see the `ipc` events which are pending from Cypress tests:

- Switch to 'Your App' frame
- App.ipc() <-- returns you object with pending events
