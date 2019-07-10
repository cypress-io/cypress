# Deployment

Anyone can build the binary and NPM package, but you can only deploy the Cypress application
and publish the NPM module `cypress` if you are a member of `cypress` NPM organization.

> :information: See the [publishing](#publishing) section for how to build, test and publish a
new official version of the binary and `cypress` NPM package.

## Set next version on CIs

We build the NPM package and binary on all major platforms (Linux, Mac, Windows) on different CI
providers. In order to set the version while building we have to set the environment variable
with the new version on each CI provider *before starting the build*.

Use script command `npm run set-next-ci-version` to do this.

## Building

### Building the NPM package

> :warning: Note: The steps in this section are automated in CI, and you should not generally need to do them yourself.

Building a new NPM package is very quick.

- Increment the version in the root `package.json`
- `cd cli && npm run build`

The steps above:

- Build the `cypress` NPM package
- Transpiles the code into ES5 version to be compatible with the common Node versions
- Puts the result into the `cli/build` folder.

You could publish from there, but first you need to build and upload the binary with the *same version*;
this guarantees that when users do `npm i cypress@<x.y.z>` they can download the binary
with the same version `x.y.z` from Cypress CDN service.

### Building the binary

> :warning: Note: The steps in this section are automated in CI, and you should not generally need to do them yourself.

First, you need to build, zip and upload the application binary to the Cypress server.

You can use a single command to do all tasks at once:

```
npm run binary-deploy
```

You can also specify each command separately:

```
npm run binary-build
npm run binary-zip
npm run binary-upload
```

You can pass options to each command to avoid answering questions, for example

```
npm run binary-deploy -- --platform darwin --version 0.20.0
npm run binary-upload -- --platform darwin --version 0.20.0 --zip cypress.zip
```

If something goes wrong, see the debug messages using the `DEBUG=cypress:binary ...` environment
variable.

Because we had many problems reliably zipping the built binary, for now we need
to build both the Mac and Linux binary from Mac (Linux binary is built using
a Docker container), then zip it **from Mac**, then upload it.

### Building Linux binary in Docker

If you are using a Mac you can build the linux binary if you have docker installed.

```
npm run binary-build-linux
```

## Publishing

### Before Publishing a New Version

In order to publish a new `cypress` package to the NPM registry, we must build and test it across
multiple platforms and test projects. This makes publishing *directly* into the NPM registry
impossible. Instead, we have CI set up to do the following on every commit to `develop`:

1. Build the NPM package with the new target version baked in.
2. Build the Linux/Mac binaries on CircleCI and build Windows on AppVeyor.
3. Upload the binaries and the new NPM package to the `cdn.cypress.io` under the "beta" folder.
4. Launch the test projects like [cypress-test-node-versions](https://github.com/cypress-io/cypress-test-node-versions) and [cypress-test-example-repos](https://github.com/cypress-io/cypress-test-example-repos) using the newly-uploaded package & binary instead of installing from the NPM registry. That installation looks like this:
    ```
    export CYPRESS_INSTALL_BINARY=https://cdn.../binary/<new version>/<commit hash>/cypress.zip
    npm i https://cdn.../npm/<new version>/<commit hash>/cypress.tgz
    ```

Multiple test projects are launched for each target operating system, and the results are reported
back to GitHub using status checks so that it is easy to see if a change has broken real-world usage
of Cypress. You can see the progress of the test projects by opening the status checks on GitHub:

![Screenshot of status checks](https://i.imgur.com/AsQwzgO.png)

Once all test projects are reliably working with new changes, publishing can proceed.

### Steps to Publish a New Version

1. Make sure that you have the correct environment variables set up before proceeding.
    - You'll need Cypress AWS access keys in `aws_credentials_json`, which looks like this:
        ```text
        aws_credentials_json={"bucket":"cdn.cypress.io","folder":"desktop","key":"...","secret":"..."}
        ```
    - You'll need a [GitHub token](https://github.com/settings/tokens), a [CircleCI token](https://circleci.com/account/api),
      and a `cypress-io` account-specific [AppVeyor token](https://ci.appveyor.com/api-keys) in `ci_json`:
        ```text
        ci_json={"githubToken":"...","circleToken":"...","appVeyorToken":"..."}
        ```
    - Tip: Use [as-a](https://github.com/bahmutov/as-a) to manage environment variables for different situations.
2. Use the `move-binaries` script to move the binaries for `<commit sha>` from `beta` to the `desktop` folder
    for `<new target version>`
    ```
    npm run move-binaries -- --sha <commit sha> --version <new target version>
    ```
3. Publish the new NPM package under the dev tag. The unique link to the package file `cypress.tgz`
    is the one already tested above. You can publish to the NPM registry straight from the URL:
    ```
    npm publish https://cdn.../npm/3.4.0/<long sha>/cypress.tgz --tag dev
    ```
4. Double-check that the new version has been published under the `dev` tag using `npm info cypress` or [available-versions](https://github.com/bahmutov/available-versions):
    ```
    dist-tags:
    dev: 3.4.0     latest: 3.3.2
    ```
5. Test `cypress@3.4.0` again to make sure everything is working. You can trigger test projects
    from the command line (if you have the appropriate permissions)
    ```
    node scripts/test-other-projects.js --npm cypress@3.4.0 --binary 3.4.0
    ```
6. Update and publish the changelog and any release-specific documentation changes in [cypress-documentation](https://github.com/cypress-io/cypress-documentation).
7. Make the new NPM version the "latest" version by updating the dist-tag `latest` to point to the new version:
    ```
    npm dist-tag add cypress@3.4.0
    ```
8. Run `binary-release` to update the download server's manifest, set the next CI version, and create an empty version commit:
    ```
    npm run binary-release -- --version 3.4.0 --commit`
    ```
9. Tag the current commit with `v3.4.0` and push that tag up.
10. If needed, push out the updated changes to the docs manifest to `on.cypress.io`.
11. If needed, push out an updated kitchen sink.
12. Close the release in [ZenHub](https://app.zenhub.com/workspaces/test-runner-5c3ea3baeb1e75374f7b0708/reports/release).
13. Bump `version` in `package.json` from `develop` branch and then merge into `master`.
14. Using [cypress-io/release-automations][release-automations]:
    - Publish GitHub release to [cypress-io/cypress/releases](https://github.com/cypress-io/cypress/releases) using package `set-releases` (see its README for details).
    - Add a comment to each GH issue that has been resolved with the new published version using package `issues-in-release` (see its README for details)

Take a break, you deserve it! :sunglasses:

[release-automations]: https://github.com/cypress-io/release-automations
