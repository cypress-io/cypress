# @cypress/vite-plugin-cypress-esm

A Vite plugin that intercepts and rewrites ES module imports. It wraps them in a `Proxy`, allowing for instrumentation by libraries such as Sinon. Useful for test runners using Vite as a dev server.

> **Note:** This package is a pre-release and is not yet stable. There are likely to be bugs and edge cases. Please report and bugs [here](https://github.com/cypress-io/cypress/issues/new?labels=npm:%20@cypress/vite-plugin-cypress-esm)

## Debugging

Run Cypress with `DEBUG=cypress:vite-plugin-cypress-esm`. You will get logs in the terminal, for the code transformation, and in the browser console, for intercepting and wrapping the modules in a Proxy. 
## Compatibility

| @cypress/vite-plugin-mock-esm | cypress |
| ------------------------ | ------- |
| >= v1                    | >= v12  |

## Usage

This is tampers with your ES modules to make them mutable (thus compatible with methods like `cy.spy()` and `cy.stub()` that require modifying otherwise sealed objects) you probably only want to apply this during your Cypress tests. One way to do so would be in `cypress.config`:

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

## Known Issues

This module uses a regexp based approach to transforming the modules on the server to facilicate wrapping them in a `Proxy` on the client. In future updates, a more robust AST based approach will be explored. 

All known [import syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) is supported with the exception of a default import combined with `* as alias` in a single line.

```js
import defaultExport3, * as name2 from "./module";
```

An alterntive would simply be to split the import syntax over two lines:

```js
import defaultExport3 from "./module";
import * as name2 from "./module";
```

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
