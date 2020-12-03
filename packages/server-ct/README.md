# server-ct

Server part of the component testing module

## To start up the dev envirronment

Move to the `example` folder. In this folder run `yarn install`

Then move back to the `server-ct` folder and run

```sh
yarn start
```

## About Component testing

To open a component testing window from cypress, run this in your project

```
cypress open --component-testing
```

Component testing is now embedded in th main cypress binary.
There is no need to install an npm plugin package to launch it.

The main 2 differences with e2e are:
- It opens a browser directly with the list of specs on the left of the reporter
- No need to start your dev engine anymore. Bring your components and cypress will render them for testing.

## Architecture

When `cypress open` is called it starts `packages/server`. 
In `packages/server`, there are a few [working modes](../server/lib/modes/index.js).
Component-testing is one of those modes.

After starting the server from [component-testing.js](../server/lib/modes/component-testing.js) it creates a server entirely inside server-ct.
Server-ct finally turns on the webpack server and the cypress server.

Cypress receives all requests and proxy all non specifically cypress requests to webpack in [routes-ct.js](./src/route-ct.js).
