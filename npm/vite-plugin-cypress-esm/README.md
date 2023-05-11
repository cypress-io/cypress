# @cypress/vite-plugin-cypress-esm

A Vite plugin that intercepts and rewrites ES module imports within [Cypress component tests](https://docs.cypress.io/guides/component-testing/overview). The [ESM specification](https://tc39.es/ecma262/#sec-modules) generates modules that are "sealed", requiring the runtime (the browser) to prevent any alteration to the module namespace. While this has security and performance benefits, it prevents use of mocking libraries which would need to replace namespace members. This plugin wraps modules in a special [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) implementation, allowing for instrumentation by libraries such as Sinon.

> **Note:** This package is a pre-release alpha and is not yet stable. There are likely to be bugs and edge cases. Please report any bugs [here](https://github.com/cypress-io/cypress/issues/new?labels=npm:%20@cypress/vite-plugin-cypress-esm). [Learn more about Cypress release stages](https://docs.cypress.io/guides/references/release-stages#Alpha) and expectations around stability.

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
        )
      }
    }
  }
})
```

### `ignoreList`

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

React is known to have some conflicts with the Proxy implementation that cause problems stubbing internal React functionality. Since it is unlikely you want to stub parts of React itself, it's a good idea to add it to the `ignoreList`.

## Known Issues

### Import Syntax

All known [import syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) is supported, however there may edge cases that have not been identified.

### Regular Expression matching

This module uses Regular Expression matching to transform the modules on the server to facilitate wrapping them in a `Proxy` on the client. In future updates, a more robust AST-based approach will be explored. A limitation of the current approach is that it does not recognize syntax from actual code vs content found within strings (for instance, an error string that contains example code syntax). This can result in inappropriately modified string constants.

### Auto-hosting

ESM imports are automatically hoisted to the top of a given module so they happen first before any code that references them. This plugin does not currently perform any hoisting, so imports are transformed to variable references in place. If you have code that attempts to reference an imported value prior to that import it will likely break. This is a known issue with HMR logic in Svelte projects, and will typically present as a "use before define" error.

### Self-references and internal calls

This plugin works by intercepting calls coming *in* to a module. This will not work for situations where a module attempts to make *internal* calls to a function within the same module or directly compare against a function within the same module. Eg:

```js
// mod_1.js
export function foo () {
  // ...
}

export function bar (mod) {
  return mod === foo 
}

// mod_2.js
import { foo, bar } from './mod_1.js'

bar(foo) //=> false
```

In this example, `bar(foo)` is passing a reference to `mod_1.foo`, where `mod_1` is a module wrapped in a `Proxy`. In the original `mod_1.js`, the reference to `foo` is the original, unwrapped `foo`, so the comparison return `false`. This may cause issues in some libraries, such as React Router when lazy loading routes. You can add modules to `ignoreList` to work around this issue.

### Sinon compatibility

This plugin is designed to work with [Sinon](https://sinonjs.org/) since that is what Cypress uses internally for `cy.stub` and `cy.spy` - attempting to utilize other stubbing/mocking libraries or directly mutating modules is not a supported use case and will likely not work as expected.

## Troubleshooting

This is an **_Alpha_** release, meaning there a very likely bugs in the implementation and it is expected that you will encounter issues. We appreciate any bug reports once you have performed the troubleshooting process below.

If you encounter issues:
1. Ensure you're using the very latest version of this Plugin and Cypress
2. Try temporarily removing this plugin from your test's Vite config - if the issue is still present then it is not related to this plugin.
3. Verify you have not encountered one of the [Known Issues](#known-issues)
3. If the issue disappeared then try narrowing down if it's related to a specific module/dependency by using the `ignoreList` config
4. If your problem isn't related to a specific dependency and can't be isolated please file a bug report [here](https://github.com/cypress-io/cypress/issues/new?labels=npm:%20@cypress/vite-plugin-cypress-esm). A reproduction case project is extremely helpful to track down specific issues, and capturing [Debug Logs](#debugging) from both your terminal *and* the browser devtools console is very helpful.

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
