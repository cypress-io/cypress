# Cypress CLI [![Circle CI](https://circleci.com/gh/cypress-io/cypress-cli.svg?style=shield)](https://circleci.com/gh/cypress-io/cypress-cli)

This is the CLI for: [https://github.com/cypress-io/cypress](https://github.com/cypress-io/cypress).

## What this does

This is the `Cypress CLI` tool used for the Desktop Application.

You run tasks such as:

- Installing Cypress
- Running Cypress Headlessly
- Checking the current version

## Documentation

[The documentation has moved into our official docs here.](https://on.cypress.io/cli)

## Contributing

```bash
 npm test                                             ## run tests
 npm run test-debug                                   ## run tests w/node inspector
 npm version [major | minor | patch] -m "release %s"  ## update version
 npm publish                                          ## publish to npm
```

## Changelog

#### 0.13.1 - *(02/11/17)*
- add --record option, pass --cli-version to cypress

#### 0.13.0 - *(02/11/17)*
- deprecated 'cypress ci'
- 'cypress run' now accepts a --key argument and a --record false argument
- search for CYPRESS_RECORD_KEY env var
- more intelligently spawn XVFB
- some horrid code cleanup

#### 0.12.2 - *(01/21/17)*
- bump core releaser

#### 0.12.1
- bump update-notifier dep for configstore fixes

#### 0.12.0
- added cli arg for passing reporterOptions

#### 0.11.1
- cypress ci accepts --spec argument

#### 0.11.0
- `cypress open` now accepts arguments
- you can now pass the --config flag to `cypress run`, `ci`, and `open` which overrides `cypress.json` configuration values
