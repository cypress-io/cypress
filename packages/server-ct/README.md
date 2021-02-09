# server-ct

This is the server that powers Cypress Component Testing.

## Developing

There is a local example project, `crossword-example`. `cd` in there and run `yarn`. Now `cd` back up and run `yarn cypress:open` for interactive mode, or `yarn cypress:run` for run mode. 

Alternatively, you can go to either `npm/vue` or `npm/react` and use those examples. You can start them by running the same commands above.

## Building

Note: you should not ever need to build the .js files manually. `@packages/ts` provides require-time transpilation when in development.
o

`yarn test-unit` to run the tests.

## Architecture

When `cypress open` is called it starts `packages/server`. 
In `packages/server`, there are a few [working modes](../server/lib/modes/index.js).
Component-testing is one of those modes.

After starting the server from [component-testing.js](../server/lib/modes/interactive-ct.ts) it creates a server entirely inside server-ct.
Server-ct finally turns on the webpack server and the cypress server.

Cypress receives all requests and proxy all non specifically cypress requests to webpack in [routes-ct.js](./src/route-ct.ts).
