# What are we testing?

Project has a support file that uses `cypress-axe`, which uses `axe-core`, both of which are installed by PnP and don't live in `node_modules`, but are preprocessed by `cypress` via `webpack` in `./packages/server/node_modules/@cypress/webpack-batteries-included-preprocessor` (`./npm/webpack-batteries-included-preprocessor` packaged with Cypress server) relative to the monorepo root. That `webpack` binary needs to resolve its build dependencies from within the cypress binary, including built-ins to `process`, but needs to resolve the dependencies bundled in the specs/support file from the `pnp` cache.

Since dependencies cannot be installed normally as we do with regular system tests via yarn v1, we need to run this as a binary system test.
See `yarn-pnp-preprocessor-system-test` inside `./circleci/workflows.yml`.
