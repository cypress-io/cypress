# @cypress/vite-dev-server

> ⚡️ + 🌲 Cypress Component Testing w/ Vite

To install vite in you component testing environment,
1. Install it `yarn add @cypress/vite-dev-server`
2. Add it to `cypress/plugins/index.js`

```js
import { startDevServer } from '@cypress/vite-dev-server'

module.exports = (on, config) => {
  on('dev-server:start', async (options) => startDevServer({ options }))

  return config
}
```

# @cypress/webpack-dev-server

> **Note** this package is not meant to be used outside of cypress component testing.

Install `@cypress/vue` or `@cypress/react` to get this package working properly

## Architecture

### Cypress server

- Every HTTP request goes to the cypress server which returns an html page. We call "TOP" because of its name in the dev tools
    This page
    - renders the list of spec files
    - And the timetraveling command log
    - Finally, it renders an AUT Iframe. this iframe calls a url that has 2 parts concatenated.
        - a prefix: `__cypress/iframes/` 
        - the path to the current. For example: `src/components/button.spec.tsx`
- In the cypress server, calls prefixed with `__cypress/iframes/...` will be passed to the dev-server as `__cypress/src/index.html`
- Every call with the prefix `__cypress/src/` will be passed to the dev-server to deal as is, without changes.

### Dev-server

- Responds to every query with the prefix `__cypress/src/` (base path should be this prefix).
- Responds to `__cypress/src/index.html` with an html page. 
    This page
    - will contain an element `<div id="__cy_root"></div>`. Tis will be used by mount function to mount the app containing the components we want.
    - will load support files
    - will load the current spec from the url
    - will start the test when both files are done loading
- The server re-runs the tests as soon as the current spec or any dependency is updated by calling an event `devServerEvents.emit('dev-server:compile:success')`

## Vite dev server

- Takes the users `vite.config` and adds base of `__cypress/src/` and a cypress vite plugin.
- The cypress plugin takes care of
  - responding to the index.html query with an html page
  - restarting the tests when files are changed
- The HTML page calls a script that loads support file and the specs using a native `import()` function
- Then triggers the loaded tests

Vite is reponsible for compiling and bundling all the files. We use its error overlay to display any transpiling error.
Omly runtime errors have to be handled through cypress

## Changelog

[Changelog](./CHANGELOG.md)
