# Cypress Developer ESLint Plugin

Common ESLint rules shared by Cypress packages.

**Note that this is meant for packages that are part of Cypress and not necessarily for a project that uses Cypress.**

## Installation

```
npm install --save-dev eslint-plugin-cypress-dev
```

## Usage

Extend one or more of the presets depending on the nature of the package:

```js
// .eslintrc
{
  "extends": [
    "plugin:cypress-dev/general",
    "plugin:cypress-dev/tests",
    "plugin:cypress-dev/react"
  ]
}
```

## Presets

### general

The majority of the rules concerning JavaScript. Should usually be used at the root of the package.

### tests

Test-specific configuration and rules. Should be used within the `test` directory.

### react

React and JSX-specific configuration and rules.

## Dependencies

Due to a limitation in how ESLint plugins work, your package needs to install the ESLint plugins that this plugin depends on:

If using the `tests` preset:

```bash
npm install --save-dev eslint-plugin-mocha
```

If using the `react` preset:

```bash
npm install --save-dev babel-eslint eslint-plugin-react
```

## License

This project is licensed under the terms of the [MIT license](/LICENSE.md).
