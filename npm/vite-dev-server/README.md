# @cypress/vite-dev-server

Implements the APIs for the object-syntax of the Cypress Component-testing "vite dev server".

> **Note:** This package is bundled with the Cypress binary and should not need to be installed separately. See the [Component Framework Configuration Docs](https://docs.cypress.io/guides/component-testing/component-framework-configuration) for setting up component testing with vite. The `devServer` function signature is for advanced use-cases.

Object syntax:

```ts
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'create-react-app',
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

| @cypress/vite-dev-server | cypress |
| ------------------------ | ------- |
| <= v2                    | <= v9   |
| >= v3                    | >= v10  |

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
