# @cypress/vite-dev-server

Implements the APIs for the object-syntax of the Cypress Component-testing "vite dev server".

> **Note:** This package is bundled with the Cypress binary and should not need to be installed separately. See the [Component Framework Configuration Docs](https://docs.cypress.io/guides/component-testing/component-framework-configuration) for setting up component testing with vite. The `devServer` function signature is for advanced use-cases.

Object syntax:

```ts
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      // viteConfig?: Will try to infer, if passed it will be used as is
    }
  }
})
```

Function syntax:

```ts
import { devServer } from '@cypress/vite-dev-server'
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer(devServerConfig) {
      return devServer({
        ...devServerConfig,
        framework: 'react',
        viteConfig: require('./vite.config.js')
      })
    }
  }
})
```

## Architecture

There should be a single publicly-exported entrypoint for the module, `devServer`, all other types and functions should be considered internal/implementation details, and types stripped from the output.

The `devServer` will first source the modules from the user's project, falling back to our own bundled versions of libraries. This ensures that the user has installed the current modules, and throws an error if the user does not have the library installed.

From there, we check the "framework" field to source or define any known vite transforms to aid in the compilation.

We then merge the sourced config with the user's vite config, and layer on our own transforms, and provide this to a vite instance. The vite instance used to create a vite-dev-server, which is returned.

## Compatibility

| @cypress/vite-dev-server | cypress       |
| ------------------------ | ------------- |
| <= v2                    | <= v9         |
| >= v3 <= v5              | >= v10 <= v13 |
| >= v6                    | >= v14        |
| >= v7 (esm only)         | >= v15        |

#### `devServerPublicPathRoute` for Vite v5+

If using Vite version 5, setting `devServerPublicPathRoute` may be needed if directly referencing public path url assets in components under test. This is due to Cypress using its own public path, `/__cypress/src`, when running component tests. This can be configured within the `component` namespace below if you wish you set your public path to be the same as your app:

```ts
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    // If wanting a publicPath the same as the default in Vite 5
    devServerPublicPathRoute: ''
  }
})
```

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)