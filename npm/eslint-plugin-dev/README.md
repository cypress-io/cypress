
<div>
    <!-- <img src="docs/readme-logo.png"> -->
    <h1>[Internal] Cypress Developer ESLint Plugin</h1>

<p>Common ESLint rules shared by Cypress packages.</p>

</div>

> ⚠️ This package is **private** and is not published. It exists to serve the packages in this monorepo that are still on eslintrc, and is retired as each of them moves to [`@packages/eslint-config`](../../packages/eslint-config), the ESLint 9 flat config that is the destination for all monorepo linting.
>
> Nothing outside this repository should depend on it. The plugin published to npm up to `7.0.0` stays available for anything already pinned to it, but no further versions ship. Looking for the plugin meant for _users_ of Cypress? That's the [**Official Cypress ESLint Plugin**](https://github.com/cypress-io/eslint-plugin-cypress).

## Usage

> ⚠️ Supports ESLint 8 only. Flat config and ESLint 9 live in `@packages/eslint-config`.

A package in this monorepo that still uses eslintrc picks this up through the root `.eslintrc.js`. To opt a directory into the test rules, add an `.eslintrc.json` alongside it:
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

A package's `.eslintignore` needs this line so hidden files are still linted, which is what lets the json config files get formatted:
```sh
# don't ignore hidden files, useful for formatting json config files
!.*
```

Staged files are linted on commit through `husky` and `lint-staged`, configured at the repo root. Editor setup is [detailed below](#editors).

## Presets

### general

_Should usually be used at the root of the package._
- The majority of the rules. 
- auto-fixes `json` files and sorts your `package.json` via [`eslint-plugin-json-format`](https://github.com/bkucera/eslint-plugin-json-format)


**peer dependencies** (provided at the repo root):
```sh
eslint-plugin-import
eslint-plugin-json-format
@typescript-eslint/parser
@typescript-eslint/eslint-plugin
```

### tests

Test-specific configuration and rules. Should be used within the `test/` directory.

**peer dependencies** (provided at the repo root):
```sh
eslint-plugin-mocha
```

### react

React and JSX-specific configuration and rules.

**peer dependencies** (provided at the repo root):
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
