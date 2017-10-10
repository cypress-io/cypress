## Deployment

Anyone can build the binary and NPM package, but you can only deploy Cypress application 
and publish NPM module `cypress` if you are a member of `cypress` NPM organization.

**important** see the [publishing](#publishing) section for how to build, test and publish a 
new official version of the binary and `cypress` NPM package.

### Building the NPM package

Building a new NPM package is very quick. 

- increment the version in the root `package.json`
- `cd cli && npm run build`

This builds the `cypress` NPM package, transpiles the code into ES5 version to be compatible
with the common Node versions and puts the result into `cli/build` folder. You could
publish from there, but first you need to build and upload the binary with *same version*;
this guarantees that when users do `npm i cypress@<x.y.z>` they can download the binary
with same version `x.y.z` from Cypress CDN service.

### Building the binary

First, you need to build, zip and upload application binary to Cypress server.

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

If something goes wrong, see debug messages using `DEBUG=cypress:binary ...` environment
variable.

Because we had many problems reliably zipping built binary, for now we need
to build both Mac and Linux binary from Mac (Linux binary is built using
a Docker container), then zip it **from Mac**, then upload it.

### Linux Docker

If you're Mac you can build the linux binary if you have docker installed.

```
npm run binary-build-linux
```

### Publishing

In order to publish a new `cypress` package to the NPM registry, we must build and test it across
multiple platforms and test projects. This makes publishing *directly* into the NPM registry
impossible. Instead we 

- Build the package (with new target version baked in) and the binary. 
    We build Linux and Windows binaries on CircleCI and AppVeyor.
- upload binaries *and the new NPM package* to Cypress CDN under "beta" url
- launch test CI projects, like [cypress-test-node-versions](https://github.com/cypress-io/cypress-test-node-versions) and [cypress-test-example-repos](https://github.com/cypress-io/cypress-test-example-repos) with unique urls instead of installing from the NPM registry.
A typical installation looks like this

```
export CYPRESS_BINARY_VERSION=https://cdn.../binary/<new version>/hash/cypress.zip
npm i https://cdn.../npm/<new version>/hash/cypress.tgz
```

- All test projects are triggered automatically by the build projects, but we need to look at CIs
    to make sure new binary and NPM package really work without breaking any of the tests.
- Each binary and NPM package has new version inside and in the URL, for example `1.0.5`. The url
    also contains the original commit SHA from which it was built.
- Build the Mac binary and upload (see above) to the CDN. Make sure to build it from the 
    same commit as the binaries built by CI
- The upload from Mac binary will create new folder on CDN like 
    `https://cdn.../desktop/1.0.5/osx64`. We need to create parallel subfolders for 
    Windows and Linux binaries. Go to AWS console and create them. In this case you would create
    folders `desktop/1.0.5/linux64` and `desktop/1.0.5/win64`.
- Copy _the tested binaries_ from unique `binary` folder into `desktop/1.0.5` subfolders for each
    platform.
- Publish the new NPM package under dev tag. The unique link to the package file `cypress.tgz` 
    is the one already tested above. You can publish to NPM registry straight from the URL

        $ npm publish https://cdn.../npm/1.0.5/<long sha>/cypress.tgz --tag dev
        + cypress@1.0.5
- Check that new version has the right tag using 
    [available-versions](https://github.com/bahmutov/available-versions)

```
$ vers cypress
0.20.1                      16 days        
0.20.2                      3 days             latest
1.0.5                       a few seconds ago  dev
```

- Test `cypress@1.0.5` again to make sure everything is working. You can trigger test projects
    from command line (if you have appropriate permissions)

        node scripts/test-other-projects.js --npm cypress@1.0.5 --binary 1.0.5

- write changelog
- publish changelog
- close issues (link to changelog)
- update npm dist tag to `latest`  using `npm dist-tag add cypress@1.0.5`
- update `manifest.json` for download server `npm run binary-release -- --version 1.0.5`

Take a break, you deserve it!
