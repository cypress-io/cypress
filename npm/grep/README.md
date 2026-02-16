# @cypress/grep

> Filter and organize your Cypress tests with grep and tag-based filtering

[![npm version](https://badge.fury.io/js/%40cypress%2Fgrep.svg)](https://badge.fury.io/js/%40cypress%2Fgrep)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What It Does

`@cypress/grep` gives you test filtering capabilities:

- **Filter by test title**: Run only tests containing specific text
- **Filter by tags**: Use custom tags to organize and run specific test groups
- **Pre-filter specs**: Skip loading specs that don't contain matching tests
- **Test burning**: Repeat tests multiple times to catch flaky behavior
- **Smart filtering**: Combine title and tag filters for precise test selection

## Installation

### 1. Install the package

```shell
npm install --save-dev @cypress/grep
```

or

```shell
yarn add --dev @cypress/grep
```

**Requirements**: Cypress 10.0.0 or higher

### 2. Register in your support file

**Required**: Add this to your `cypress/support/e2e.js` (or equivalent):

```js
// cypress/support/e2e.js
const { register: registerCypressGrep } = require('@cypress/grep')
registerCypressGrep()
```

Or using ES modules / TypeScript:

```ts
// cypress/support/e2e.ts
import { register as registerCypressGrep } from '@cypress/grep'
registerCypressGrep()
```

### 3. Optional: Add to config for spec filtering

**Optional**: Add to `cypress.config.js` to enable spec pre-filtering:

```js
// cypress.config.js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin')
      cypressGrepPlugin(config)
      return config
    },
  },
})
```

Or using ES modules / TypeScript:

```ts
// cypress.config.ts
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      cypressGrepPlugin(config)
      return config
    },
  },
})
```

## Basic Usage

### Filter by Test Title

Run tests with "login" in the title:

```shell
npx cypress run --expose grep="login"
```

Run tests with "user authentication" in the title:

```shell
npx cypress run --expose grep="user authentication"
```

Multiple title patterns (OR logic):

```shell
npx cypress run --expose grep="login; logout; signup"
```

### Filter by Tags

First, add tags to your tests:

```js
// Single tag
it('should login successfully', { tags: '@smoke' }, () => {
  // test code
})

// Multiple tags
it('should handle errors', { tags: ['@smoke', '@critical'] }, () => {
  // test code
})

// Tags on describe blocks
describe('User Management', { tags: '@user' }, () => {
  it('should create user', () => {
    // test code
  })
})
```

Then run by tags:

Run tests with @smoke tag:

```shell
npx cypress run --expose grepTags="@smoke"
```

Run tests with @smoke OR @critical tags:

```shell
npx cypress run --expose grepTags="@smoke @critical"
```

Run tests with BOTH @smoke AND @critical tags:

```shell
npx cypress run --expose grepTags="@smoke+@critical"
```

Run tests with @smoke tag but NOT @slow tag:

```shell
npx cypress run --expose grepTags="@smoke+-@slow"
```

### Combine Title and Tag Filters

Run tests with "login" in title AND tagged @smoke:

```shell
npx cypress run --expose grep="login",grepTags="@smoke"
```

Run tests with "user" in title AND tagged @critical OR @smoke:

```shell
npx cypress run --expose grep="user",grepTags="@critical @smoke"
```

## Advanced Features

### Pre-filter Specs

Skip loading specs that don't contain matching tests (requires plugin setup):

Only run specs containing tests with "login" in title:

```shell
npx cypress run --expose grep="login",grepFilterSpecs=true
```

Only run specs containing tests tagged @smoke:

```shell
npx cypress run --expose grepTags="@smoke",grepFilterSpecs=true
```

### Omit Filtered Tests

By default, filtered tests are marked as pending. To completely omit them:

```shell
npx cypress run --expose grep="login",grepOmitFiltered=true
```

### Test Burning (Repeat Tests)

Run filtered tests multiple times to catch flaky behavior:

Run matching tests 5 times:

```shell
npx cypress run --expose grep="login",burn=5
```

Run all tests 10 times:

```shell
npx cypress run --expose burn=10
```

### Inverted Filters

Run tests WITHOUT "slow" in the title:

```shell
npx cypress run --expose grep="-slow"
```

Run tests WITHOUT @slow tag:

```shell
npx cypress run --expose grepTags="-@slow"
```

Complex combinations:

```shell
npx cypress run --expose grep="login; -slow",grepTags="@smoke+-@regression"
```

### Run Untagged Tests

Run only tests without any tags:

```shell
npx cypress run --expose grepUntagged=true
```

## Configuration Examples

### In cypress.config.js

```js
import { defineConfig } from 'cypress'
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin'

export default defineConfig({
  expose: {
    // Always filter by viewport tests
    grep: "viewport",
    // Always enable spec filtering
    grepFilterSpecs: true,
    // Always omit filtered tests
    grepOmitFiltered: true
  },
  e2e: {
    setupNodeEvents(on, config) {
      cypressGrepPlugin(config)
      return config
    },
  },
})
```

### In package.json scripts

```json
{
  "scripts": {
    "cy:smoke": "cypress run --expose grepTags=@smoke",
    "cy:critical": "cypress run --expose grepTags=@critical",
    "cy:fast": "cypress run --expose grepTags=@fast",
    "cy:burn": "cypress run --expose grepTags=@smoke,burn=5"
  }
}
```

## TypeScript Support

As of v5 of `@cypress/grep`, TypeScript declaration files are now included.
These definitions should be automatically detected, but in the case you are using
an older `moduleResolution` or configuration, some of the below techniques should work.

### Option 1: Reference types (Recommended)

```js
// At the top of your spec file
/// <reference types="@cypress/grep" />

it('should work', { tags: '@smoke' }, () => {
  // TypeScript will recognize the tags property
})
```

### Option 2: Add to tsconfig.json

```json
{
  "compilerOptions": {
    "types": ["cypress", "@cypress/grep"]
  }
}
```

### Option 3: Ignore TypeScript errors

```js
// @ts-ignore
it('should work', { tags: '@smoke' }, () => {
  // test code
})
```

## DevTools Console

While running Cypress in interactive mode (`cypress open`), you can filter tests from the browser console:

```js
// Filter by title
Cypress.grep('login')

// Filter by tags
Cypress.grep(null, '@smoke @critical')

// Filter by title AND tags
Cypress.grep('login', '@smoke')

// Remove filters
Cypress.grep()
```

## Limitations

### Known Limitations

1. **Spec Loading**: When not using `grepFilterSpecs`, all spec files are loaded before filtering occurs
2. **Inverted Filters**: Negative filters (`-tag`, `-title`) are not compatible with `grepFilterSpecs`
3. **Runtime Changes**: Cannot change grep filters at runtime using `Cypress.expose()`
4. **Cloud Recordings**: Filtered tests may still appear in Cypress Cloud recordings as pending tests

## Best Practices

### Tag Naming Convention

```js
// ✅ Good: Use @ prefix for searchability
describe('Authentication', { tags: '@auth' }, () => {
  it('should login', { tags: '@smoke @critical' }, () => {
    // test code
  })
})

// ❌ Avoid: Space-separated tags in single string
it('should work', { tags: '@smoke @fast' }, () => {
  // This creates ONE tag: "@smoke @fast"
})

// ✅ Good: Use array for multiple tags
it('should work', { tags: ['@smoke', '@fast'] }, () => {
  // This creates TWO tags: @smoke and @fast
})
```

### Workflow Strategy

1. Run smoke tests first:

```shell
npx cypress run --expose grepTags="@smoke"
```

2. If smoke tests pass, run all tests:

```shell
npx cypress run
```

3. For debugging, run specific test groups:

```shell
npx cypress run --expose grep="user management"
```

```shell
npx cypress run --expose grepTags="@critical"
```

### Performance Tips

- Use `grepFilterSpecs=true` for large test suites
- Combine filters to narrow down test selection
- Use tags consistently across your test suite

## Troubleshooting

### Debug Mode

Enable debug logging to see what's happening:

Terminal debug (for plugin):

```shell
DEBUG=@cypress/grep npx cypress run --expose grep="login"
```

Browser debug (for support file):
In DevTools console:

```js
localStorage.debug = '@cypress/grep'
```

Then refresh and run tests.

## Examples

- [cypress-grep-example](https://github.com/bahmutov/cypress-grep-example) - Complete working example
- [todo-graphql-example](https://github.com/bahmutov/todo-graphql-example) - Real-world usage

## Migration

### From v5 to v6

`Cypress.env()` is deprecated in Cypress 15.10.0. For public configuration, the API has been replaced with `Cypress.expose()`

To migrate, change your `--env`/`-e` CLI arguments from
```sh
npx cypress run --env grepTags="tag1 tag2"
```

to the following to use `--expose`/`-x`
```sh
npx cypress run --expose grepTags="tag1 tag2"
```


### From v4 to v5

The support file registration and plugin have changed their export signature, meaning:

In your support file, change the registration function from
```js
const registerCypressGrep = require('@cypress/grep')
```

to the following
```js
const { register: registerCypressGrep } = require('@cypress/grep')
```

Additionally, in your support file, change the plugin registration from
```js
const cypressGrepPlugin = require('@cypress/grep/src/plugin')
```

to the following
```js
const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin')
```

### From v2 to v3/v4

- Requires Cypress 10.0.0+
- No breaking changes in functionality

### From v1 to v2

- `--env grep="tag1 tag2"` → `--env grepTags="tag1 tag2"`
- Title filtering and tag filtering are now separate

## Support

- **Documentation**: [Cypress Docs](https://docs.cypress.io)
- **Community**: [Cypress Discord](https://discord.gg/cypress)

## License

MIT - See [LICENSE](LICENSE) file for details.
