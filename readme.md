## Cypress Gui [![CircleCI](https://circleci.com/gh/cypress-io/cypress-core-desktop-gui.svg?style=shield&circle-token=2d68c0ace2f8c89ce0ddbf3f14776764f9f70d0f)](https://circleci.com/gh/cypress-io/cypress-core-desktop-gui)

This repository contains the source code for the Cypress Desktop App Gui.

## Installing

```bash
npm install @cypress/core-desktop-gui
```

## Developing

To run the GUI in dev mode, you need to run the [Cypress App](https://github.com/cypress-io/cypress-app).

- Navigate to `cypress-app` and run the following commands:

```bash
npm i
npm start
```

The GUI should now be in your taskbar. Click in the taskbar to open it.

In your console, you will probably see the following error:

```bash
Error: connect ECONNREFUSED 127.0.0.1:1234
 > It looks like you're not running the local api server in development. This may cause problems running the GUI.
```

In order to access the api to do things like logging into the GUI, we need to run the [Cypress API](https://github.com/cypress-io/cypress-api). Navigate to `cypress-api` and run the following commands:

```bash
npm i
npm start
```

If you get any errors doing the above commands, go through the [install instructions](https://github.com/cypress-io/cypress-api) of the cypress-api app.

## Testing

1. Watch your files and run the gui in port `6060`.

```bash
npm test
```

2. Start the server within Cypress desktop app and navigate to [http://localhost:2020/](http://localhost:2020/).

## Debugging

If you want to see the `ipc` events which are pending from Cypress tests:

- Switch to 'Your App' frame
- App.ipc() <-- returns you object with pending events

## License
LGPL

## Changelog

#### 0.1.2
- updated license

#### 0.1.1
- renamed to cypress-core-desktop-gui
- removed dead code

#### 0.1.0
- initial release
