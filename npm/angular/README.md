> A little helper to unit test React components in the open source [Cypress.io](https://www.cypress.io/) test runner **v7.0.0+**

**Jump to:** [Comparison](#comparison), [Blog posts](#blog-posts), [Install](#install), Examples: [basic](#basic-examples), [advanced](#advanced-examples), [full](#full-examples), [external](#external-examples), [Style options](#options), [Code coverage](#code-coverage), [Visual testing](#visual-testing), [Common problems](#common-problems), [Chat](#chat)

## TLDR

- What is this? This package allows you to use [Cypress](https://www.cypress.io/) test runner to unit test your Angular components with zero effort. Here is a typical component testing, notice there is not external URL shown, since it is mounting the component directly.

![Example component test](images/dynamic.gif)

- How is this different from [Angular Testing](https://angular.io/guide/testing) or [ATL](https://testing-library.com/docs/angular-testing-library/intro/)? It is similar in functionality BUT runs the component in the real browser with full power of Cypress E2E test runner: [live GUI, full API, screen recording, CI support, cross-platform](https://www.cypress.io/features/), and [visual testing](https://on.cypress.io/visual-testing). 
- Read [My Vision for Component Tests in Cypress](https://glebbahmutov.com/blog/my-vision-for-component-tests/) by Gleb Bahmutov

## Comparison

<!-- prettier-ignore-start -->
Feature | Jest / Karma / ATL | Cypress + `@cypress/angular`
--- | --- | ---
Test runs in real browser | ❌ | ✅
Supports shallow mount | ✅ | ❌
Supports full mount | ✅ | ✅
Test speed | 🏎 | [as fast as the app works in the browser](#fast-enough)
Test can use additional plugins | maybe | use any [Cypress plugin](https://on.cypress.io/plugins)
Test can interact with component | synthetic limited API | use any [Cypress command](https://on.cypress.io/api)
Test can be debugged | via terminal and Node debugger | use browser DevTools
Built-in time traveling debugger | ❌ | Cypress time traveling debugger
Re-run tests on file or test change | ✅ | ✅
Test output on CI | terminal | terminal, screenshots, videos
Tests can be run in parallel | ✅ | ✅ via [parallelization](https://on.cypress.io/parallelization)
Test against interface | if using `@testing-library/angular` | ✅ and can use `@testing-library/cypress`
Spying and stubbing methods | Jest mocks | [Sinon library](https://on.cypress.io/stubs-spies-and-clocks)
Stubbing imports | ✅ | ✅
Stubbing clock | ✅ | ✅
Code coverage | ✅ | ✅
<!-- prettier-ignore-end -->

If you are coming from Jest + ATL world, read [Test The Interface Not The Implementation](https://glebbahmutov.com/blog/test-the-interface/).

## Blog posts

- [My Vision for Component Tests in Cypress](https://glebbahmutov.com/blog/my-vision-for-component-tests/)

## Install

Requires [Node](https://nodejs.org/en/) version 12 or above.

```sh
npm install --save-dev cypress @cypress/angular @cypress/webpack-dev-server
```


## API

- `mount` allows you to mount a given Angular component as a mini web application and interact with it using Cypress commands

## Examples

```ts
import { mount } from '@cypress/angular'
import { HelloWorldComponent } from './hello-world.component'

describe('HelloWorldComponent', () => {
  it('works', () => {
    mount(HelloWorldComponent)
    // now use standard Cypress commands
    cy.contains('Hello World!').should('be.visible')
  })
})
```

Look at the examples in [cypress/component](cypress/component) folder. Here is the list of examples showing various testing scenarios.

### Basic examples
Coming Soon...


### Advanced examples
Coming Soon...

### Full examples
Coming Soon...

### External examples
Coming Soon...

## Options


## Code coverage

In order to use code coverage you can follow the instructions from [docs](https://github.com/cypress-io/code-coverage). In most of cases you need to install 2 dependencies: 

```
npm i @cypress/code-coverage babel-plugin-istanbul

yarn add @cypress/code-coverage babel-plugin-istanbul
```

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


## Chat

Come chat with us [on discord](https://discord.gg/7ZHYhZSW) in the #component-testing channel.

## Development

See [docs/development.md](./docs/development.md)

## Debugging

You can see verbose logs from this plugin by running with environment variable

```
DEBUG=@cypress/angular
```

Because finding and modifying Webpack settings while running this plugin is done by [find-webpack](https://github.com/bahmutov/find-webpack) module, you might want to enable its debug messages too.

```
DEBUG=@cypress/angular,find-webpack
```

## Changelog

[Changelog](./CHANGELOG.md)

## Related tools

Same feature for unit testing components from other frameworks using Cypress

- [@cypress/react](https://github.com/cypress-io/cypress/tree/develop/npm/react)
- [@cypress/vue](https://github.com/cypress-io/cypress/tree/develop/npm/vue)
- [cypress-cycle-unit-test](https://github.com/bahmutov/cypress-cycle-unit-test)
- [cypress-svelte-unit-test](https://github.com/bahmutov/cypress-svelte-unit-test)
- [@cypress/angular](https://github.com/bahmutov/@cypress/angular)
- [cypress-hyperapp-unit-test](https://github.com/bahmutov/cypress-hyperapp-unit-test)
- [cypress-angularjs-unit-test](https://github.com/bahmutov/cypress-angularjs-unit-test)
