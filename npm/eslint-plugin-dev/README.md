
<div>
    <!-- <img src="docs/readme-logo.png"> -->
    <h1>[Internal] Cypress Developer ESLint Plugin</h1>
    <a href="https://www.npmjs.com/package/@cypress/eslint-plugin-dev"><img src="https://img.shields.io/npm/v/@cypress/eslint-plugin-dev.svg?style=flat"></a>
    <a href="https://circleci.com/gh/cypress-io/eslint-plugin-dev/tree/develop"><img src="https://img.shields.io/circleci/build/gh/cypress-io/eslint-plugin-dev.svg"></a>

<p>Common ESLint rules shared by Cypress packages.</p>

</div>

> ⚠️ This package for _internal development_ of Cypress. Here's the [**Official Cypress ESLint Plugin**](https://github.com/cypress-io/eslint-plugin-cypress) meant for users of Cypress.


## Installation

```
npm install --save-dev @cypress/eslint-plugin-dev
```

## Usage

> ⚠️ Currently does **not** support ESLint version 9

For Eslint 8, use version 6.x.x

For Eslint 7 and below, use version 5.x.x

1) install the following `devDependencies`:
```sh
@cypress/eslint-plugin-dev
eslint-plugin-json-format
@typescript-eslint/parser
@typescript-eslint/eslint-plugin
eslint-plugin-mocha
eslint-plugin-import

# if you have react/jsx files
eslint-plugin-react
@babel/eslint-parser
```

2) add the following to your root level `.eslintrc.json`:
```json
{
  "plugins": [
    "@cypress/dev"
  ],
  "extends": [
    "plugin:@cypress/dev/general"
  ]
}
```

> Note: also add `"plugin:@cypress/dev/react"`, if you are using `React`

> Note: if you have a `test/` directory, you should create a `.eslintrc.json` file inside of it, and add:
```json
{
  "extends": [
    "plugin:@cypress/dev/tests"
  ]
}
```

3) add the following to your `.eslintignore`:
```sh
# don't ignore hidden files, useful for formatting json config files
!.*
```

4) (optional) Install and configure your text editor's ESLint Plugin Extension to lint and auto-fix files using ESLint, [detailed below](#editors)

5) (optional) Install [`husky`](https://github.com/typicode/husky) and enable the lint `pre-commit` hook:

`package.json`:
```json
  "husky": {
    "hooks": {
      "pre-commit": "lint-pre-commit"
    }
  },
```
> Note: the `lint-pre-commit` hook will automatically lint your staged files, and only `--fix` and `git add` them if there are no unstaged changes existing in that file (this protects partially staged files from being added in the hook).  
To auto-fix all staged & unstaged files, run `./node_modules/.bin/lint-changed --fix`

## Presets

### general

_Should usually be used at the root of the package._
- The majority of the rules. 
- auto-fixes `json` files and sorts your `package.json` via [`eslint-plugin-json-format`](https://github.com/bkucera/eslint-plugin-json-format)


**requires you to install the following `devDependencies`**:
```sh
eslint-plugin-import
eslint-plugin-json-format
@typescript-eslint/parser
@typescript-eslint/eslint-plugin
```

### tests

Test-specific configuration and rules. Should be used within the `test/` directory.

**requires you to install the following `devDependencies`**:
```sh
eslint-plugin-mocha
```

### react

React and JSX-specific configuration and rules.

**requires you to install the following `devDependencies`**:
```sh
@babel/eslint-parser
eslint-plugin-react
```

## Configuration Examples

Change some linting rules:
```js
// .eslintrc.json
{
  "extends": [
    "plugin:@cypress/dev/general"
  ],
  "rules": {
    "comma-dangle": "off",
    "no-debugger": "warn"
  }
}
```

Stop your `package.json` from being formatted:
```json
{
  "settings": {
    "json/sort-package-json": false
  }
}
```

### Custom Rules:
name | description | options | example
-|-|-|-
`@cypress/dev/arrow-body-multiline-braces` | Enforces braces in arrow functions ONLY IN multiline function definitions | [`[always|never] always set this to 'always'`] | `'@cypress/dev/arrow-body-multiline-braces': ['error', 'always']`
`@cypress/dev/skip-comment` | Enforces a comment (`// NOTE:`) explaining a `.skip` added to `it`, `describe`, or `context` test blocks | { commentTokens: `[array] tokens that indicate .skip explanation (default: ['NOTE:', 'TODO:', 'FIXME:']`)} | `'@cypress/dev/skip-comment': ['error', { commentTokens: ['TODO:'] }]`
`@cypress/dev/no-return-before` | Disallows `return` statements before certain configurable tokens | { tokens: `[array] tokens that cannot be preceded by 'return' (default: ['it', 'describe', 'context', 'expect']`)} | `'@cypress/dev/no-return-before': ['error', { tokens: ['myfn'] }]`

## <a name="editors"></a>Editors

### VSCode

Use plugin [ESLint by Dirk Baeumer](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to lint and auto fix JS files using ESLint.  
After installing, add the following to your User or Workspace (`.vscode/settings.json`) settings:
```json
{
  "eslint.validate": [
    { 
      "language": "javascript",
      "autoFix": true
    },
    {
      "language": "javascriptreact",
      "autoFix": true
    },
    {
      "language": "typescript",
      "autoFix": true
    },
    {
      "language": "typescriptreact",
      "autoFix": true
    },
    {
      "language": "json",
      "autoFix": true
    }
  ],
}
```

### Atom

Install package [linter-eslint](https://atom.io/packages/linter-eslint)
(and its dependencies) to enable linting. Go into the settings for this package
and enable "Fix on save" option to auto-fix white space issues and other things.

### Sublime Text

Install [ESLint-Formatter](https://packagecontrol.io/packages/ESLint-Formatter),
then set the following settings:

```json
{
  "format_on_save": true,
  "debug": true
}
```

## License

This project is licensed under the terms of the [MIT license](/LICENSE.md).

## Changelog

[Changelog](./CHANGELOG.md)
