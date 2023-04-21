# @cypress/vite-plugin-cypress-esm

A Vite plugin that intercepts and rewrites ES module imports within [Cypress component tests](https://docs.cypress.io/guides/component-testing/overview). The [ESM specification](https://tc39.es/ecma262/#sec-modules) generates modules that are "sealed", requiring the runtime (the browser) to prevent any alteration to the module namespace. While this has security and performance benefits, it prevents use of mocking libraries which would need to replace namespace members. This plugin wraps modules in a special [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) implementation, allowing for instrumentation by libraries such as Sinon.

> **Note:** This package is a pre-release and is not yet stable. There are likely to be bugs and edge cases. Please report any bugs [here](https://github.com/cypress-io/cypress/issues/new?labels=npm:%20@cypress/vite-plugin-cypress-esm)

## Debugging

Run Cypress with `DEBUG=cypress:vite-plugin-cypress-esm`. You will get logs in the terminal, for the code transformation, and in the browser console, for intercepting and wrapping the modules in a Proxy. 
## Compatibility

| @cypress/vite-plugin-mock-esm | cypress |
| ------------------------ | ------- |
| >= v1                    | >= v12  |

## Usage

This plugin rewrites the ES modules served by Vite to make them mutable and therefore compatible with methods like [`cy.spy()`](https://docs.cypress.io/api/commands/spy) and [`cy.stub()`](https://docs.cypress.io/api/commands/stub) that require modifying otherwise-sealed objects. Since this is a testing-specific plugin it is recommended to apply it your Vite config only when running your Cypress tests. One way to do so would be in `cypress.config`:

```ts
import { defineConfig } from 'cypress'
import viteConfig from './vite.config'
import { mergeConfig } from 'vite'
import { CypressEsm } from '@cypress/vite-plugin-cypress-esm'

export default defineConfig({
  component: {
    devServer: {
      bundler: 'vite',
      framework: 'react',
      viteConfig: () => {
        return mergeConfig(
          viteConfig,
          {
            plugins: [
              CypressEsm(),
            ]
          }
        ),
      }
    },
  }
})
```

Some modules may be incompatible with Proxy-based implementation. The eventual goal is to support wrapping all modules in a Proxy to better facilitate testing. For now, if you run into any issues with a particular module, you can add it to the `ignoreList` like so:

```ts
CypressEsm({
  ignoreList: ['react-router', 'react-router-dom']
})
```

You can also use a glob, which uses [`picomatch`](https://github.com/micromatch/picomatch) internally:

```ts
CypressEsm({
  ignoreList: ['*react*']
})
```

React is known to have some conflicts with the Proxy implementation. You probably don't want to stub your UI library anyway, so it's a good idea to add it to the `ignoreList`.

## Known Issues

* This module uses Regular Expression matching to transform the modules on the server to facilitate wrapping them in a `Proxy` on the client. In future updates, a more robust AST-based approach will be explored. 
* All known [import syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) is supported, however there may edge cases that have not been identified
* Auto-hosting of imports is *not* performed, rather they are currently transformed in place. This may result in some code behaving differently, typically observed as a "use before define" error.

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
