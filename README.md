# cypress-react-unit-test [![CircleCI](https://circleci.com/gh/bahmutov/cypress-react-unit-test/tree/main.svg?style=svg)](https://circleci.com/gh/bahmutov/cypress-react-unit-test/tree/main) [![Cypress.io tests](https://img.shields.io/badge/cypress.io-tests-green.svg?style=flat-square)](https://dashboard.cypress.io/#/projects/z9dxah) [![renovate-app badge][renovate-badge]][renovate-app]

> A little helper to unit test React components in the open source [Cypress.io](https://www.cypress.io/) E2E test runner **v4.5.0+**

**Jump to:** [Comparison](#comparison), [Blog posts](#blog-posts), [Install](#install), Examples: [basic](#basic-examples), [advanced](#advanced-examples), [full](#full-examples), [external](#external-examples), [Style options](#options), [Code coverage](#code-coverage), [Visual testing](#visual-testing), [Common problems](#common-problems)

## Survey

Hi there! We are trying to collect feedback from Cypress users who need component testing. Answer a few questions [in this survey](https://forms.gle/qiX2ScqPNEMgwvfA9) about component testing to help us 🙏

## TLDR

- What is this? This package allows you to use [Cypress](https://www.cypress.io/) test runner to unit test your React components with zero effort. Here is a typical component testing, notice there is not external URL shown, since it is mounting the component directly.

![Example component test](images/dynamic.gif)

- How is this different from [Enzyme](https://github.com/airbnb/enzyme) or [RTL](https://testing-library.com/docs/react-testing-library/intro)? It is similar in functionality BUT runs the component in the real browser with full power of Cypress E2E test runner: [live GUI, full API, screen recording, CI support, cross-platform](https://www.cypress.io/features/), and [visual testing](https://on.cypress.io/visual-testing). Ohh, and the code coverage is built-in!
- If you like using `@testing-library/react`, you can use `@testing-library/cypress` for the same `findBy`, `queryBy` commands, see one of the examples in the list below
- Read [My Vision for Component Tests in Cypress](https://glebbahmutov.com/blog/my-vision-for-component-tests/)

## Comparison

<!-- prettier-ignore-start -->
Feature | Jest / Enzyme / RTL | Cypress + `cypress-react-unit-test`
--- | --- | ---
Test runs in real browser | ❌ | ✅
Supports shallow mount | ✅ | ❌
Supports full mount | ✅ | ✅
Test speed | 🏎 | as fast as the app works in the browser
Test can use additional plugins | maybe | use any [Cypress plugin](https://on.cypress.io/plugins)
Test can interact with component | synthetic limited API | use any [Cypress command](https://on.cypress.io/api)
Test can be debugged | via terminal and Node debugger | use browser DevTools
Built-in time traveling debugger | ❌ | Cypress time traveling debugger
Re-run tests on file or test change | ✅ | ✅
Test output on CI | terminal | terminal, screenshots, videos
Tests can be run in parallel | ✅ | ✅ via [parallelization](https://on.cypress.io/parallelization)
Test against interface | if using `@testing-library/react` | ✅ and can use `@testing-library/cypress`
Spying and stubbing methods | Jest mocks | Sinon library
Stubbing imports | ✅ | ✅
Stubbing clock | ✅ | ✅
Code coverage | ✅ | ✅
<!-- prettier-ignore-end -->

## Blog posts

- [My Vision for Component Tests in Cypress](https://glebbahmutov.com/blog/my-vision-for-component-tests/)
- [Unit Testing React components with Cypress](https://itnext.io/unit-testing-react-components-with-cypress-4d4cf8cd59a0)
- [Test React Component with cypress-react-unit-test Example](https://dev.to/bahmutov/test-react-component-with-cypress-react-unit-test-example-4d99)
- [Tic-Tac-Toe Component Tests](https://glebbahmutov.com/blog/tic-tac-toe-component-tests/)
- [Using .env and .env.test from React component tests](https://medium.com/@bahmutov/using-env-and-env-test-from-react-component-tests-c11aa2040bc8)
- [Visual testing for React components using open source tools](https://glebbahmutov.com/blog/open-source-visual-testing-of-components/)
- [12 Recipes for testing React applications using cypress-react-unit-test](https://dev.to/bahmutov/12-recipes-for-testing-react-applications-using-cypress-react-unit-test-46g6) (compare to [12 Recipes for testing React applications using Testing Library](https://dev.to/jooforja/12-recipes-for-testing-react-applications-using-testing-library-1bh2#portal))

## Known problems

See issues labeled [v4](https://github.com/bahmutov/cypress-react-unit-test/labels/v4)

## Install

Requires [Node](https://nodejs.org/en/) version 8 or above.

```sh
npm install --save-dev cypress cypress-react-unit-test
```

1. Include this plugin from your project's `cypress/support/index.js`

```js
require('cypress-react-unit-test/support')
```

2. Tell Cypress how your React application is transpiled or bundled (using Webpack), so Cypress can load your components. For example, if you use `react-scripts` (even after ejecting) do:

```js
// cypress/plugins/index.js
module.exports = (on, config) => {
  require('cypress-react-unit-test/plugins/react-scripts')(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
```

See [Recipes](./docs/recipes.md) for more examples.

3. ⚠️ Turn the experimental component support on in your `cypress.json`. You can also specify where component spec files are located. For example, to have them located in `src` folder use:

```json
{
  "experimentalComponentTesting": true,
  "componentFolder": "src"
}
```

## API

- `mount` is the most important function, allows to mount a given React component as a mini web application and interact with it using Cypress commands
- `unmount` removes previously mounted component, mostly useful to test how the component cleans up after itself
- `mountHook` mounts a given React Hook in a test component for full testing, see `hooks` example

## Examples

```js
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { HelloWorld } from './hello-world.jsx'
describe('HelloWorld component', () => {
  it('works', () => {
    mount(<HelloWorld />)
    // now use standard Cypress commands
    cy.contains('Hello World!').should('be.visible')
  })
})
```

Look at the examples in [cypress/component](cypress/component) folder. Here is the list of examples showing various testing scenarios.

### Basic examples

<!-- prettier-ignore-start -->
Spec | Description
--- | ---
[alias](cypress/component/basic/alias) | Retrieve mounted component by its name or alias
[alert-spec.js](cypress/component/basic/alert-spec.js) | Component tries to use `window.alert`
[counter-set-state](cypress/component/basic/counter-set-state) | Counter component that uses `this.state`
[counter-use-hooks](cypress/component/basic/counter-use-hooks) | Counter component that uses `useState` hook
[emotion-spec.js](cypress/component/basic/emotion-spec.js) | Confirms the component is using `@emotion/core` and styles are set
[error-boundary-spec.js](cypress/component/basic/error-boundary-spec.js) | Checks if an error boundary component works
[pure-component-spec.js](cypress/component/basic/pure-component.spec.js) | Tests stateless component
[stateless-spec.js](cypress/component/basic/stateless-spec.js) | Passes Cypress stub to the component, confirms the component calls it on click
[window-spec.js](cypress/component/basic/window-spec.js) | In the component test, the spec `window` and the application's `window` where the component is running should be the same object
[css](cypress/component/basic/css) | Shows that component with `import './Button.css'` works
[network](cypress/component/basic/network) | Confirms we can use `cy.route` to stub / spy on component's network calls
[no-visit](cypress/component/basic/no-visit) | Component specs cannot call `cy.visit`
[react-book-by-chris-noring](cypress/component/basic/react-book-by-chris-noring) | Copied test examples from [React Book](https://softchris.github.io/books/react) and adapted for Cypress component tests
[react-tutorial](cypress/component/basic/react-tutorial) | Tests from official [ReactJS tutorial](https://reactjs.org/tutorial/tutorial.html) copied and adapted for Cypress component tests
[stub-example](cypress/component/basic/stub-example) | Uses `cy.stub` as component props
[styles](cypress/component/basic/styles) | Add extra styles to the component during testing using `style`, `cssFile` or `stylesheets` mount options
[toggle-example](cypress/component/basic/toggle-example) | Testing a toggle component using Cypress DOM commands
[typescript](cypress/component/basic/typescript) | A spec written in TypeScript
[unmount](cypress/component/basic/unmount) | Verifies the component's behavior when it is unmounted from the DOM
[use-lodash-fp](cypress/component/basic/use-lodash-fp) | Imports and tests methods from `lodash/fp` dependency
[document-spec](cypress/component/basic/document) | Checks `document` dimensions from the component
[styled-components](cypress/component/basic/styled-components) | Test components that use [styled-components](https://www.styled-components.com/)
<!-- prettier-ignore-end -->

plus a few smaller sanity specs in [cypress/component/basic](cypress/component/basic) folder.

### Advanced examples

<!-- prettier-ignore-start -->
Spec | Description
--- | ---
[api-test](cypress/component/advanced/api-test) | Mix [REST api tests](https://glebbahmutov.com/blog/api-testing-with-sever-logs/) that use [cy-api](https://github.com/bahmutov/cy-api) with component tests
[app-action-example](cypress/component/advanced/app-action-example) | App actions against components
[context](cypress/component/advanced/context) | Confirms components that use React context feature work
[custom-command](cypress/component/advanced/custom-command) | Wraps `mount` in a custom command for convenience
[forward-ref](cypress/component/advanced/forward-ref) | Tests a component that uses a forward ref feature
[hooks](cypress/component/advanced/hooks) | Tests several components that use React Hooks like `useState`, `useCallback`
[lazy-loaded](cypress/component/advanced/lazy-loaded) | Confirms components that use `React.lazy` and dynamic imports work
[material-ui-example](cypress/component/advanced/material-ui-example) | Large components demos from [Material UI](https://material-ui.com/)
[mock-fetch](cypress/component/advanced/mock-fetch) | Test stubs `window.fetch` used by component in `useEffect` hook
[mocking-axios](cypress/component/advanced/mocking-axios) | Stubbing methods from a 3rd party component like `axios`
[mocking-component](cypress/component/advanced/mocking-component) | Replaced a child component with dummy component during test
[mocking-imports](cypress/component/advanced/mocking-imports) | Stub a named ES6 import in various situations
[react-router-v6](cypress/component/advanced/react-router-v6) | Example testing a [React Router v6](https://github.com/ReactTraining/react-router)
[renderless](cypress/component/advanced/renderless) | Testing a component that does not need to render itself into the DOM
[set-timeout-example](cypress/component/advanced/set-timeout-example) | Control the clock with `cy.tick` and test loading components that use `setTimeout`
[testing-lib-example](cypress/component/advanced/testing-lib-example) | A spec adopted from [@testing-library/react](https://testing-library.com/docs/react-testing-library/example-intro) that uses [@testing-library/cypress](https://testing-library.com/docs/cypress-testing-library/intro)
[timers](cypress/component/advanced/timers) | Testing components that set timers, adopted from [ReactJS Testing recipes](https://reactjs.org/docs/testing-recipes.html#timers)
[tutorial](cypress/component/advanced/tutorial) | A few tests adopted from [ReactJS Tutorial](https://reactjs.org/tutorial/tutorial.html), including Tic-Tac-Toe game
[use-local-storage](cypress/component/advanced/use-local-storage) | Use hooks to load and save items into `localStorage`
[portal](cypress/component/advanced/portal) | Component test for `ReactDOM.createPortal` feature
[react-bootstrap](cypress/component/advanced/react-bootstrap) | Confirms [react-bootstrap](https://react-bootstrap.github.io/) components are working
[select React component](cypress/component/advanced/react-book-example/src/components/ProductsList.spec.js) | Uses [cypress-react-selector](https://github.com/abhinaba-ghosh/cypress-react-selector) to find DOM elements using React component name and state values
<!-- prettier-ignore-end -->

### Full examples

We have several subfolders in [examples](examples) folder that have complete projects with just their dependencies installed in the root folder.

<!-- prettier-ignore-start -->
Folder Name | Description
--- | ---
[a11y](examples/a11y) | Testing components' accessibility using [cypress-axe](https://github.com/avanslaars/cypress-axe)
[react-scripts](examples/react-scripts) | A project using `react-scripts` with component tests in `src` folder, including the `.env` files demo.
[react-scripts-folder](examples/react-scripts-folder) | A project using `react-scripts` with component tests in `cypress/component`
[tailwind](examples/tailwind) | Testing styles built using [Tailwind CSS](https://tailwindcss.com/)
[sass-and-ts](examples/sass-and-ts) | Example with Webpack, Sass and TypeScript
[snapshots](examples/snapshots) | Component HTML and JSON snapshots using [cypress-plugin-snapshots](https://github.com/meinaart/cypress-plugin-snapshots)
[visual-sudoku](examples/visual-sudoku) | [Visual testing](#visual-testing) for components using open source plugin [cypress-image-snapshot](https://github.com/palmerhq/cypress-image-snapshot). For larger example with an hour long list of explanation videos, see [bahmutov/sudoku](https://github.com/bahmutov/sudoku).
[visual-testing-with-percy](examples/visual-testing-with-percy) | [Visual testing](#visual-testing) for components using 3rd party service [Percy.io](https://percy.io/)
[visual-testing-with-happo](examples/visual-testing-with-happo) | [Visual testing](#visual-testing) for components using 3rd party service [Happo](https://happo.io/)
[visual-testing-with-applitools](examples/visual-testing-with-applitools) | [Visual testing](#visual-testing) for components using 3rd party service [Applitools.com](https://applitools.com/)
[using-babel](examples/using-babel) | Bundling specs and loaded source files using project's existing `.babelrc` file
[webpack-file](examples/webpack-file) | Load existing `webpack.config.js` file
[webpack-options](examples/webpack-options) | Using the default Webpack options from `@cypress/webpack-preprocessor` to transpile JSX specs
<!-- prettier-ignore-end -->

### External examples

This way of component testing has been verified in a number of forked 3rd party projects.

<!-- prettier-ignore-start -->
Repo | Description
--- | ---
[try-cra-with-unit-test](https://github.com/bahmutov/try-cra-with-unit-test) | Hello world initialized with CRAv3
[try-cra-app-typescript](https://github.com/bahmutov/try-cra-app-typescript) | Hello world initialized with CRAv3 `--typescript`
[react-todo-with-hooks](https://github.com/bahmutov/react-todo-with-hooks) | Modern web application using hooks
[test-redux-examples](https://github.com/bahmutov/test-redux-examples) | Example apps copies from official Redux repo and tested as components
[test-react-hooks-animations](https://github.com/bahmutov/test-react-hooks-animations) | Testing React springs fun blob animation
[test-mdx-example](https://github.com/bahmutov/test-mdx-example) | Example testing MDX components using Cypress
[test-apollo](https://github.com/bahmutov/test-apollo) | Component testing an application that uses Apollo GraphQL library
[test-xstate-react](https://github.com/bahmutov/test-xstate-react) | XState component testing using Cypress
[test-react-router-v5](https://github.com/bahmutov/test-react-router-v5) | A few tests of React Router v5
[test-material-ui](https://github.com/bahmutov/test-material-ui) | Testing Material UI components: date pickers, lists, autocomplete
[test-d3-react-gauge](https://github.com/bahmutov/test-d3-react-gauge) | Testing React D3 gauges
[storybook-code-coverage](https://github.com/bahmutov/storybook-code-coverage) | Example app where we get 100% code coverage easily with a single integration spec and a few component specs, replacing [several tools](https://dev.to/penx/combining-storybook-cypress-and-jest-code-coverage-4pa5)
[react-loading-skeleton](https://github.com/bahmutov/react-loading-skeleton) | One to one Storybook tests for React skeleton components. Uses local `.babelrc` settings without Webpack config
[test-swr](https://github.com/bahmutov/test-swr) | Component test for [Zeit SWR](https://github.com/zeit/swr) hooks for remote data fetching
[emoji-search](https://github.com/bahmutov/emoji-search) | Quick component test for a fork of emoji-search
[test-custom-error-boundary](https://github.com/bahmutov/test-custom-error-boundary) | Play with a component that implements error boundary
[Jscrambler-Webpack-React](https://github.com/bahmutov/Jscrambler-Webpack-React) | Example project with its own Webpack config file
[bahmutov/integration-tests](https://github.com/bahmutov/integration-tests) | Example based on blog post [React Integration Testing: Greater Coverage, Fewer Tests](https://css-tricks.com/react-integration-testing-greater-coverage-fewer-tests/)
[mobx-react-typescript-boilerplate](https://github.com/bahmutov/mobx-react-typescript-boilerplate) | Fork of the official Mobx example, shows clock control
[bahmutov/test-react-hook-form](https://github.com/bahmutov/test-react-hook-form) | Testing forms created using [react-hook-form](https://github.com/react-hook-form/react-hook-form)
[bahmutov/react-with-rollup](https://github.com/bahmutov/react-with-rollup) | Testing a React application bundled with Rollup by using [@bahmutov/cy-rollup](https://github.com/bahmutov/cy-rollup) preprocessor
[bahmutov/testing-react-example](https://github.com/bahmutov/testing-react-example) | Described in blog post [Test React Component with cypress-react-unit-test Example](https://dev.to/bahmutov/test-react-component-with-cypress-react-unit-test-example-4d99)
[ejected-react-scripts-example](https://github.com/bahmutov/ejected-react-scripts-example) | Using component testing after ejecting `react-scripts`
[tic-tac-toe](https://github.com/bahmutov/react-tic-tac-toe-example) | Component and unit tests for Tic-Tac-Toe, read [Tic-Tac-Toe Component Tests](https://glebbahmutov.com/blog/tic-tac-toe-component-tests/)
[react-hooks-file-upload](https://github.com/bahmutov/react-hooks-file-upload) | Upload a file from the component while stubbing the server
[react-query-example](https://github.com/bahmutov/react-query-example) | Quick test example for components that use `react-query` with mock clock control
<!-- prettier-ignore-end -->

To find more examples, see GitHub topic [cypress-react-unit-test-example](https://github.com/topics/cypress-react-unit-test-example)

## Options

In most cases, the component already imports its own styles, thus it looks "right" during the test. If you need another CSS, the simplest way is to import it from the spec file:

```js
// src/Footer.spec.js
import './styles/main.css'
import Footer from './Footer'
it('looks right', () => {
  // styles are applied
  mount(<Footer />)
})
```

### Extra styles

You can pass additional styles, css files and external stylesheets to load, see [docs/styles.md](./docs/styles.md) for the full list of options.

```js
const todo = {
  id: '123',
  title: 'Write more tests',
}
mount(<Todo todo={todo} />, {
  stylesheets: [
    'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
  ],
})
```

<details>
<summary>Additional configuration</summary>
If your React and React DOM libraries are installed in non-standard paths (think monorepo scenario), you can tell this plugin where to find them. In `cypress.json` specify paths like this:

```json
{
  "env": {
    "cypress-react-unit-test": {
      "react": "node_modules/react/umd/react.development.js",
      "react-dom": "node_modules/react-dom/umd/react-dom.development.js"
    }
  }
}
```

</details>

## Code coverage

If you are using [plugins/cra-v3](plugins/cra-v3) it instruments the code on the fly using `babel-plugin-istanbul` and generates report using dependency [cypress-io/code-coverage](https://github.com/cypress-io/code-coverage) (included). If you want to disable code coverage instrumentation and reporting, use `--env coverage=false` or `CYPRESS_coverage=false` or set in your `cypress.json` file

```json
{
  "env": {
    "coverage": false
  }
}
```

## Visual testing

You can use any Cypress [Visual Testing plugin](https://on.cypress.io/plugins#visual-testing) to perform [visual testing](https://on.cypress.io/visual-testing) from the component tests. This repo has several example projects, see [visual-sudoku](examples/visual-sudoku), [visual-testing-with-percy](examples/visual-testing-with-percy), [visual-testing-with-happo](examples/visual-testing-with-happo), and [visual-testing-with-applitools](examples/visual-testing-with-applitools).

For a larger Do-It-Yourself example with an hour long list of explanation videos, see [bahmutov/sudoku](https://github.com/bahmutov/sudoku) repository. I explain how to write visual testing using open source tools in this [blog post](https://glebbahmutov.com/blog/open-source-visual-testing-of-components/), [video talk](https://www.youtube.com/watch?v=00BNExlJUU8), and [slides](https://slides.com/bahmutov/i-see-what-is-going-on).

## Common problems

<details id="node-sass">
  <summary>Node Sass</summary>

When using Node Sass styles, tell Cypress to use [the system NodeJS](https://on.cypress.io/configuration#Node-version) rather than its bundled version. In `cypress.json` set option:

```json
{
  "nodeVersion": "system"
}
```

Find full example in [sass-and-ts](examples/sass-and-ts) folder.

</details>

<details id="speed">
  <summary>Slow bundling</summary>

When you bundle spec file, you are now bundling React, Read DOM and other libraries, which is might be slow. For now, you can disable inline source maps by adding to your Webpack config settings (if available) the following:

```js
const webpackOptions = {
  devtool: false,
}
```

Keep your eye on issue [#156](https://github.com/bahmutov/cypress-react-unit-test/issues/156) for more information.

</details>

<details id="missing-code-coverage">
  <summary>Missing code coverage</summary>

If you are using your custom Webpack, this plugin might be missing code coverage information because the code was not instrumented. We try to insert the `babel-plugin-istanbul` plugin automatically, but your bundling might not use Babel, or configure it differently, preventing plugin insertion. Please let us know by opening an issue with full reproducible details.

See related issue [#141](https://github.com/bahmutov/cypress-react-unit-test/issues/141). You can also debug the plugin's behavior by running it with `DEBUG` environment variable, see [#debugging](#debugging) section.

</details>

<details id="next-not-supported">
  <summary>Next.js projects not supported</summary>

Currently, this project cannot find Webpack settings used by Next.js, thus it cannot bundle specs and application code correctly. Keep an eye on [#155](https://github.com/bahmutov/cypress-react-unit-test/issues/155)

</details>

<details id="gatsby-not-supported">
  <summary>Gatsby.js projects not supported</summary>

Currently, this project cannot find Webpack settings used by Gatsby.js, thus it cannot bundle specs and application code correctly. Keep an eye on [#307](https://github.com/bahmutov/cypress-react-unit-test/issues/307)

</details>

## Development

See [docs/development.md](./docs/development.md)

## Debugging

You can see verbose logs from this plugin by running with environment variable

```
DEBUG=cypress-react-unit-test
```

Because finding and modifying Webpack settings while running this plugin is done by [find-webpack](https://github.com/bahmutov/find-webpack) module, you might want to enable its debug messages too.

```
DEBUG=cypress-react-unit-test,find-webpack
```

## Migration guide

### From v3 to v4

The old v3 `main` branch is available as branch [v3](https://github.com/bahmutov/cypress-react-unit-test/tree/v3)

- the `cy.mount` is now simply `import { mount } from 'cypress-react-unit-test'`
- the support file is simply `require('cypress-react-unit-test/support')`

## Related tools

Same feature for unit testing components from other frameworks using Cypress

- [cypress-vue-unit-test](https://github.com/bahmutov/cypress-vue-unit-test)
- [cypress-cycle-unit-test](https://github.com/bahmutov/cypress-cycle-unit-test)
- [cypress-svelte-unit-test](https://github.com/bahmutov/cypress-svelte-unit-test)
- [cypress-angular-unit-test](https://github.com/bahmutov/cypress-angular-unit-test)
- [cypress-hyperapp-unit-test](https://github.com/bahmutov/cypress-hyperapp-unit-test)
- [cypress-angularjs-unit-test](https://github.com/bahmutov/cypress-angularjs-unit-test)

[renovate-badge]: https://img.shields.io/badge/renovate-app-blue.svg
[renovate-app]: https://renovateapp.com/
