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

`npm install -g cypress`

This will make the `cypress` command globally available.

## Available Commands

##### cypress install

##### cypress run

##### cypress ci

##### cypress get:key

##### cypress new:key

##### cypress verify

## Coming Soon Commands

##### cypress update

##### cypress login

##### cypress get:path

##### cypress set:path

##### cypress add:project

##### cypress remove:project

## Contributing

```bash
 npm test                                             ## run tests
 npm run test-debug                                   ## run tests w/node inspector
 npm version [major | minor | patch] -m "release %s"  ## update version
 npm release                                          ## release to npm
```