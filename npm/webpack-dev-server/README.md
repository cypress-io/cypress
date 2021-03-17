# Webpack-ct

> **Note** this package is not meant to be used outside of cypress component testing.

Install `@cypress/vue` or `@cypress/react` to get this package working properly

## Responsibilities

- Make a `webpack.config` from the users setup
    - add current project rules and aliases
    - remove eslint?
- Launch webpack dev server
- Update entry point (in `src/browser.ts`)
- The entry point (`browser.ts`) has to delegate the loading of spec files to the loader + plugin

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
