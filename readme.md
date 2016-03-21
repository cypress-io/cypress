# Cypress CLI [![Circle CI](https://circleci.com/gh/cypress-io/cypress-cli.svg?style=shield)](https://circleci.com/gh/cypress-io/cypress-cli)

This is the CLI for: [https://github.com/cypress-io/cypress](https://github.com/cypress-io/cypress).

View our progress: [https://www.pivotaltracker.com/n/projects/1531501](https://www.pivotaltracker.com/n/projects/1531501)

## What this does

This is the `Cypress CLI` tool used for communicating with the real `Cypress Desktop Application`.

For instance you can do common tasks like:

- Installing Cypress
- Running Cypress Headlessly
- Generating API Keys

## Installation

```bash
npm install -g cypress
```

This will make the `cypress` command globally available from your command line.

You can now execute the following commands:

## Available Commands

##### [cypress install](#cypress-install-1)
##### [cypress update](#cypress-update-1)
##### [cypress run](#cypress-run-1)
##### [cypress ci](#cypress-ci-1)
##### [cypress open](#cypress-open-1)
##### [cypress get:path](#cypress-getpath-1)
##### [cypress get:key](#cypress-getkey-1)
##### [cypress new:key](#cypress-newkey-1)
##### [cypress remove:ids](#cypress-removeids-1)
##### [cypress verify](#cypress-verify-1)
##### [cypress version](#cypress-version-1)

--

### cypress install

Installs the `Cypress Desktop Application` to the default location for each Operating System.

OS | Path
:--- | :---
Mac  | `/Applications/Cypress.app`
Linux  | `/home/<user>/.cypress/Cypress`

```bash
## by default will install the latest version
cypress install
```

```bash
## install a specific version
cypress install --cypress-version 0.13.0
```

Additionally if you have a `CYPRESS_VERSION` environment variable set, it will automatically download that version. Useful in CI.

> [Watch a video of Cypress being installed](https://docs.cypress.io/docs/installing-and-running#section-installing)

### cypress update

Updates Cypress to the latest version. This does the same thing as `cypress install`.

```bash
## now we have the latest version
cypress update
```

### cypress run

Runs Cypress headlessly. By default will run all your tests. Useful when developing locally.

```bash
## by default will use your current path
cypress run
```

```bash
## or you can specify a path to the project
cypress run /users/john/projects/TodoMVC
```

```bash
## specify a port to use which overrides values in cypress.json
cypress run --port 8080
```

```bash
## specify a mocha reporter to use
cypress run --reporter json
```

```bash
## specify a spec to run instead of running all the tests
cypress run --spec app_spec.js
```

```bash
## specify environment variables
cypress run --env host=api.dev.local
```

You can [read more about environment variables here.](https://on.cypress.io/environment-variables)

### cypress ci

Run Cypress headlessly in CI. [Read the Continuous Integration docs for examples.](https://on.cypress.io/continuous-integration)

```bash
## provide the CI secret key directly
cypress ci 1234-abcd-efgh-9876
```

```bash
## or if its setup in an env variable called CYPRESS_CI_KEY
cypress ci
```

### cypress open

Opens the Cypress application. This is the same thing as double-clicking the application.

In Mac you'll see the `Cy` icon in the tray, and in Linux you'll see the Cypress application window open.

### cypress get:path

Returns the path Cypress will be install to. Additionally checks to see if Cypress already exists at that path.

### cypress get:key

Returns your secret project key for use in CI.

### cypress new:key

Creates a new secret project key and returns that key for use in CI. This will negate previous secret keys, so be sure to update your CI to use this new key.

### cypress remove:ids

Removes the test IDs found in your specs. In versions of Cypress prior to `0.14.0` we inserted IDs directly into your code.

This feature has been removed for the foreseeable future.

### cypress verify

Verifies that the Cypress application is found.

### cypress version

Outputs both the version of the CLI Tool and the installed Cypress application.

## Upcoming Commands

These commands have not yet been released:

##### cypress login
##### cypress set:path
##### cypress add:project
##### cypress remove:project

## Contributing

```bash
 npm test                                             ## run tests
 npm run test-debug                                   ## run tests w/node inspector
 npm version [major | minor | patch] -m "release %s"  ## update version
 npm publish                                          ## publish to npm
```
