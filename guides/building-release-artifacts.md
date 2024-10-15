# Building Release Artifacts

The `cypress` npm package consists of two main parts:

1. The `cypress` npm package `.tgz` (built from [`cli`](../cli))
    * Contains the command line tool `cypress`, type definitions, and the [Module API](https://on.cypress.io/module-api).
    * End users install this via npm to the project's `node_modules` directory or via Yarn or pnpm similarly.
2. The "binary" `.zip` (built from the [`packages`](../packages) directory)
    * Contains the Electron app, `ffmpeg`, and built versions of the packages from the [`packages`](../packages) sub-directories (`frontend-shared`, `reporter` and `web-config` are not separately included).
        * Also contains all the production dependencies of the above.
    * This is installed when the `cli` is installed or when `cypress install` is run, to a system cache.

This guide has instructions for building both.

## Building the npm package

> :warning: Note: The steps in this section are automated in CI, and you should not need to do them yourself when going through the [release process](./release-process.md).

Building a new npm package is two commands:

1. Increment the version in the root `package.json`
2. `yarn lerna run build-cli`

The steps above:

- Build the `cypress` npm package
- Transpile the code into ES5 to be compatible with the common Node versions
- Put the result into the [`cli/build`](../cli/build) folder.

## Building the binary

> :warning: Note: The steps in this section are automated in CI, and you should not need to do them yourself when going through the [release process](./release-process.md).

The npm package requires a corresponding binary of the same version. In production, it will try to retrieve the binary from the Cypress CDN if it is not cached locally.

You can build the Cypress binary locally by running `yarn binary-build`, then package the binary by running `yarn binary-package`. You can use Linux to build the Cypress binary (just like it is in CI) by running `yarn binary-build` and `yarn binary-package` inside of `yarn docker`.

If you're on macOS and building locally, you'll need a code-signing certificate in your keychain, which you can get by following the [instructions on Apple's website](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Procedures/Procedures.html#//apple_ref/doc/uid/TP40005929-CH4-SW30). Also, you'll also most likely want to skip notarization since it requires an Apple Developer Program account - set `SKIP_NOTARIZATION=1` when building locally to do this. [More info about code signing in CI](./code-signing.md).

`yarn binary-zip` can be used to zip the built binary together.

### Tips

If you want to speed up the time it takes to package the binary, set `V8_SNAPSHOT_DISABLE_MINIFY=1`

If you are on an M1, you need to set `RESET_ADHOC_SIGNATURE=1` in order to be able to actually run the binary after packaging it.
