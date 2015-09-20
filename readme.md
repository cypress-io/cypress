## Cypress CLI [![Circle CI](https://circleci.com/gh/cypress-io/cypress-cli.svg?style=svg)](https://circleci.com/gh/cypress-io/cypress-cli)

This is the CLI for [https://github.com/cypress-io/cypress](https://github.com/cypress-io/cypress).

## What this does

This `CLI` enables you to interact with the Cypress Desktop Application through the command line. This is helpful for both local development and running Cypress on a CI server.

For instance you can do common tasks like:

- Installing Cypress
- Running Cypress Headlessly
- Logging into Cypress
- Generating API Keys
- Adding Projects

## Installation

```bash
npm install -g cypress
```

This will make the `cypress` command globally available from your command line.

You can now execute the following commands:

## Available Commands

##### [cypress install](#cypress-install-1)
##### [cypress run](#cypress-run-1)
##### [cypress ci](#cypress-ci-1)
##### [cypress open](#cypress-open-1)
##### [cypress get:path](#cypress-getpath-1)
##### [cypress get:key](#cypress-getkey-1)
##### [cypress new:key](#cypress-newkey-1)
##### [cypress verify](#cypress-verify-1)

--

### cypress install

Installs Cypress to the default location for each Operating System.

OS | Path
:--- | :---
Mac  | `/Applications/Cypress.app`
Linux  | `/home/<user>/.cypress/Cypress`

### cypress run

Runs Cypress headlessly. By default will run all your tests. Useful when developing locally.

### cypress ci

Run Cypress headlessly in CI. Expects your CI provider to have `XVFB` installed.

> **Note:** Most CI Providers will already have `XVFB` installed.

### cypress open

Opens the Cypress application. This is the same thing as double-clicking the application.

In Mac you'll see the `Cy` icon in the tray, and in Linux you'll see the Cypress application window open.

### cypress get:path

Returns the path Cypress will be install to. Additionally checks to see if Cypress already exists at that path.

### cypress get:key

Returns your secret project key for use in CI.

### cypress new:key

Creates a new secret project key and returns that key for use in CI. This will negate previous secret keys, so be sure to update your CI to use this new key.

### cypress verify

Verifies that the Cypress application is found and is executable.

## Upcoming Commands

These commands have not yet been released:

##### cypress update
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