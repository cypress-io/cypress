# @cypress/webpack-dev-server

Implements the APIs for the object-syntax of the Cypress Component-testing "webpack dev server".

Object syntax:

```ts
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
      // webpackConfig?: Will try to infer, if passed it will be used as is
    }
  }
})
```

Function syntax:

```ts
import { devServer } from '@cypress/webpack-dev-server'
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer(cypressConfig) {
      return devServer({
        cypressConfig,
        framework: 'react',
        webpackConfig: require('./webpack.config.js')
      })
    }
  }
})
```

## Testing

Unit tests can be run with `npm test`. Integration tests can be run with `yarn cypress:run`

This module should be primarily covered by system-tests / open-mode tests. All system-tests directories should be created using the notation:

`webpack${major}_wds${devServerMajor}-$framework{-$variant}`

- webpack4_wds3-react
- webpack4_wds4-next-11
- webpack5_wds3-next-12
- webpack4_wds4-create-react-app

## Architecture

There should be a single publicly-exported entrypoint for the module, `devServer`, all other types and functions should be considered internal/implementation details, and types stripped from the output.

The `devServer` will first source the modules from the user's project, falling back to our own bundled versions of libraries. This ensures that the user has installed the current modules, and throws an error if the user does not have the library installed.

From there, we check the "framework" field to source or define any known webpack transforms to aid in the compilation.

We then merge the sourced config with the user's webpack config, and layer on our own transforms, and provide this to a webpack instance. The webpack instance used to create a webpack-dev-server, which is returned.

## Changelog

[Changelog](./CHANGELOG.md)
