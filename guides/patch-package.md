# Patching packages

Sometimes we need to patch `node_modules` that are not in our control in order to fix bugs or add features. There are a few ways to do this:

1. Fork the package to the `cypress-io` org and install via Git hash
2. Re-publish a patched version under the `@cypress` org on NPM
3. Patch the package using the [`patch-package`](https://github.com/ds300/patch-package#readme) utility on install/build

In *most cases*, it is best to use `patch-package`. Using `patch-package` has a number of advantages over #1 and #2:

* `patch-package` avoids the need for maintaining yet another repo or `npm/` package
* `patch-package` avoids the need for keeping version numbers/Git hashes synced in `package.json`/`yarn.lock` in the monorepo
* `patch-package` makes it easy to review changes in the context of a single PR to the `cypress` repo, as opposed to having to review changes in 2+ repos
* `patch-package` side-steps [a bug in Yarn](https://github.com/yarnpkg/yarn/issues/4722) that causes extremely confusing behavior when installing/caching Git dependencies

The *only* times where we cannot use `patch-package` is if we need to make a patch that is not included in the binary. The `cli` and `npm/` packages have their transitive dependencies installed by the user's package manager, so we cannot use `patch-package` to patch them.

For example: [`@cypress/request`](https://github.com/cypress-io/request) is used in the CLI, so we maintain a separate NPM package.

Also, we cannot include Git dependencies (#1) in any NPM packages, because not all users can install Git dependencies: [#6752](https://github.com/cypress-io/cypress/issues/6752)

## Upstreaming patches

If your patch is general purpose, you should submit a PR to the dependency's repo and create an issue in the `cypress` repo that tracks your upstream PR.

Once your upstream PR is merged, we can bump the version of the patched module in the monorepo and remove the patch, along with associated maintenance burden.

## Testing patches

*All patches require tests.*

Along with regular unit/integration/etc. tests against unbuilt Cypress, there should be at least one test for the patch that uses the built version of Cypress. This prevents regressions from a patch not being applied as expected when we build Cypress.

You can add a test for your patch against the built binary in a couple of ways:

1. Create a [`binary-system-test`](../system-tests/README.md) that tests that the patched behavior is correct in the built binary.
2. Add an expectation to [`scripts/binary/util/testStaticAssets.js`](../scripts/binary/util/testStaticAssets.js) that asserts the patch is applied.
3. Add some other test that runs against the built binary in CI.