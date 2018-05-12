## Example

This repo contains the source code for pushing out [https://example.cypress.io](https://example.cypress.io).

The actual example repo you're probably looking for is [the kitchen sink app here](https://github.com/cypress-io/cypress-example-kitchensink).

**THERE'S LIKELY NO REASON YOU NEED TO EDIT ANY OF THE CODE ON THIS REPO.**

- Want to edit the example spec files? -> edit them [here](https://github.com/cypress-io/cypress-example-kitchensink/tree/master/cypress/integration/examples) instead.
- Want to edit the actual [https://example.cypress.io](https://example.cypress.io) website? edit it [here](https://github.com/cypress-io/cypress-example-kitchensink/tree/master/app) instead.

## Developing

```bash
npm install
```

## Building

After running `npm install` you must build the app + spec files.

```bash
npm run build
```

This copies the src files from [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink), modifies them to point to `https://example.cypress.io` and creates the `example_spec.js`.

## Deploying

```bash
npm run deploy
```

## Releasing

```bash
npm run release
```
