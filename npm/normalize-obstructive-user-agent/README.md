# Cypress Normalize Obstructive User Agent

A simple Cypress support plugin to modify an existing user agent that is known to be obstructive.

Currently, certain authentication providers/websites block requests coming from certain user agents. For instance, it is not uncommon for Google to block authentication requests coming from Electron as it may be deemed a less secure browser. To work around this, this support plugin attempts to normalize the browsers user agent to something that is expected. In the case of Electron, this means stripping out the Electron aspects of the user agent to allow for successful requests.

## Installation

Requires [Node](https://nodejs.org) version 16.13.2 or above.

```sh
npm install --save-dev @cypress/normalize-obstructive-user-agent
```

## Usage

Learn more about how the Support file works, see [support file](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Support-file).

### Cypress 10.0+

Inside your `e2e` support file, add the following
```javascript
const normalizeObstructiveUserAgent = require('@cypress/normalize-obstructive-user-agent');

before(() => {
  normalizeObstructiveUserAgent();  
});
```

## Contributing

Run all tests once:

```shell
yarn test
```

If wanting to test the support plugin changes against a Cypress project,
run the following inside this project

```
yarn build-watch

yarn link
```

Then, inside your Cypress project, run

```
yarn link @cypress/normalize-obstructive-user-agent 
```

This will make the typescript bundle available to your cypress project, with the bundle being rebuilt on code changes
## License

This project is licensed under the terms of the [MIT license](/LICENSE.md).