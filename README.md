# Cypress Developer ESLint Plugin

Common ESLint rules shared by Cypress packages.

Note that this is meant for packages that are part of Cypress and not necessarily for a project that uses Cypress.

## Usage

Extend one or more of the presets depending on the nature of the package:

```
// .eslintc
{
  "extends": [
    "plugin:cypress-dev/general",
    "plugin:cypress-dev/tests",
    "plugin:cypress-dev/rreact"
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
