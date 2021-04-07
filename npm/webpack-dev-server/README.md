# @cypress/webpack-dev-server

> **Note** this package is not meant to be used outside of cypress component testing.

Install `@cypress/vue` or `@cypress/react` to get this package working properly

To install `@cypress/webpack-dev-server` in you component testing environment,
1. Install it `yarn add @cypress/webpack-dev-server`
2. Add it to `cypress/plugins/index.js`

```js
import { startDevServer } from '@cypress/webpack-dev-server'

module.exports = (on, config) => {
  on('dev-server:start', async (options) => startDevServer({ options }))

  return config
}
```

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
    - will contain an element `<div id="__cy_root"></div>` to attach the mounted components to.
    - will load support files
    - will load the current spec from the url
    - will start the test when both files are done loading
- The server re-runs the tests as soon as the current spec or any dependency is updated
by calling an event `devServerEvents.emit('dev-server:compile:success')`

## Webpack

Webpack-dev-server fulfills his reponsibilities by

- Making a `webpack.config` from the users setup by changing the entrypoint to `browser.ts`
- Launches the webpack dev server with `devServer.publicPath = "__cypress/src/"` and `devServer.hot = false`
- The entry point (`browser.ts`) delegates the loading of spec files to the loader. 
    - By using a require on itself, it enables using a custom loader and Hot Module Replacements if hot is false.
- The plugin is responsible for passing down the path to the support files and the list of specs discovered by the cypress server to the loader
- The loader:
    - compares the url with each spec path given by the plugin
    - picks the spec that should be run
    - runs the `AUT-Runner.ts` to load and launch the support file and the current spec

## Performance tests 

In order to get webpack performance statistics run `yarn cypress open-ct` or `yarn cypress run-ct` with `WEBPACK_PERF_MEASURE` env variable:

```sh
WEBPACK_PERF_MEASURE=true yarn cypress run-ct
```

This will output the timings of whole webpack output and timings for each specified plugin and loader. 

### Compare results

In order to run performance tests and compare timings with the previous build run:

```sh
WEBPACK_PERF_MEASURE=true WEBPACK_PERF_MEASURE_COMPARE={name-of-project} yarn cypress run-ct
```

This will create the file `./__perf-stats/{name-of-project}.json` or if this file exists will compare results with the previously saved version. 

In order to update the `{name-of-project}.json` file and use new stats as a base for the next comparisons run:  

```sh
WEBPACK_PERF_MEASURE=true WEBPACK_PERF_MEASURE_UPDATE=true WEBPACK_PERF_MEASURE_COMPARE={name-of-project} yarn cypress run-ct
```
