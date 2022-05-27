# @cypress/vite-dev-server

Implements the APIs for the object-syntax of the Cypress Component-testing "vite dev server".

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
    devServer(cypressConfig) {
      return devServer({
        cypressConfig,
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


## Internal Options
* `CYPRESS_INTERNAL_VITE_DEV` - Set to `1` if wanting to leverage [vite's](https://vitejs.dev/guide/#command-line-interface) `vite dev` over `vite build` to avoid a full [production build](https://vitejs.dev/guide/build.html).
* `CYPRESS_INTERNAL_VITE_INSPECT` - used internally to leverage [vite-plugin-inspect](https://github.com/antfu/vite-plugin-inspect) to view intermediary vite plugin state. The `CYPRESS_INTERNAL_VITE_DEV` is required for this to be applied correctly.
* `CYPRESS_INTERNAL_VITE_OPEN_MODE_TESTING` - set to `true` when doing internal cy-in-cy type tests to access the Cypress instance from the parent frame.
* `CYPRESS_INTERNAL_VITE_APP_PORT` - leveraged only when `CYPRESS_INTERNAL_VITE_DEV` is set to spawn the vite dev server for the app on the specified port. The default port is `3333`.
* `CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT` -  leveraged only when `CYPRESS_INTERNAL_VITE_DEV` is set to spawn the vite dev server for the launchpad on the specified port. The default port is `3001`.

## Changelog

[Changelog](./CHANGELOG.md)
