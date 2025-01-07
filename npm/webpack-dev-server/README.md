# @cypress/webpack-dev-server

Implements the APIs for the object-syntax of the Cypress Component-testing "webpack dev server".

> **Note:** This package is bundled with the Cypress binary and should not need to be installed separately. See the [Component Framework Configuration Docs](https://docs.cypress.io/guides/component-testing/component-framework-configuration) for setting up component testing with webpack. The `devServer` function signature is for advanced use-cases.

Object API:

```ts
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      // webpackConfig?: Will try to infer, if passed it will be used as is
    }
  }
})
```

Function API:

```ts
import { devServer } from '@cypress/webpack-dev-server'
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer(devServerConfig) {
      return devServer({
        ...devServerConfig,
        framework: 'react',
        webpackConfig: require('./webpack.config.js')
      })
    }
  }
})
```

## Testing

Unit tests can be run with `yarn test`. Integration tests can be run with `yarn cypress:run`

This module should be primarily covered by system-tests / open-mode tests. All system-tests directories should be created using the notation:

`webpack${major}_wds${devServerMajor}-$framework{-$variant}`

- webpack4_wds4-react
- webpack5_wds5-react
- webpack4_wds4-next-11

## Architecture

There should be a single publicly-exported entrypoint for the module, `devServer`, all other types and functions should be considered internal/implementation details, and types stripped from the output.

The `devServer` will first source the modules from the user's project, falling back to our own bundled versions of libraries. This ensures that the user has installed the current modules, and throws an error if the user does not have the library installed.

From there, we check the "framework" field to source or define any known webpack transforms to aid in the compilation.

We then merge the sourced config with the user's webpack config, and layer on our own transforms, and provide this to a webpack instance. The webpack instance used to create a webpack-dev-server, which is returned.

## Compatibility

| @cypress/webpack-dev-server  | cypress        |
| ---------------------------- | -------------- |
| <= v1                        | <= v9          |
| >= v2 <= v3                  | >= v10 <= v13  |
| >= v4                        | >= v14         |

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/develop/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).

## [Changelog](./CHANGELOG.md)
