# Next Version

When the Cypress CLI and binary are built in CI, the version number they share is determined by the script in [`/scripts/get-next-version.js`](../scripts/get-next-version.js).

In most cases, the script will correctly determine the next version. If it needs to be overridden, the environment variable `NEXT_VERSION` can be set to the desired version (`NEXT_VERSION=1.2.3`). This is commonly desired on a release branch or when trying to force a specific major version.

The `get-next-version.js` script follows these steps:

1. If the environment variable `NEXT_VERSION` exists, print `NEXT_VERSION` and exit.
2. Otherwise, analyze the commits to the current branch since the last release, using semantic commit messages. Print out the calculated version.
    * Only commits that touch files in `packages/*` or `cli/*` are considered.
        * This is done so that commits to the `npm/` packages do not necessarily bump the CLI and binary versions.
    * This project uses the [`angular` commit message style](https://gist.github.com/brianclements/841ea7bffdb01346392c/8e1f9b44d3fc7a4f2b448581071f9805f759c912).
        * The prefix `fix:` will trigger a patch version bump.
        * The prefix `feat:` will trigger a minor version bump.
        * A commit with the footer containing `BREAKING CHANGE:` should trigger a major version bump.

You can debug the script locally by running it using `node ./scripts/get-next-version.js`. It will analyze the commits on your current branch and print out the calculated version number.
