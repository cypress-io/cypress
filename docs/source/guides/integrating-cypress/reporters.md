title: Reporters
comments: true
---

# Supported Reporters

Cypress supports the following reporters:

* [Mocha's built-in reporters](https://mochajs.org/#reporters).
* [`teamcity`](https://github.com/cypress-io/mocha-teamcity-reporter)
* [`junit`](https://github.com/michaelleeallen/mocha-junit-reporter)
* Custom reporters ([see below](#section-custom-reporters))

# Custom Reporters

Cypress supports custom reporters, whether local to your project or installed through npm.

## Local Reporters

Say you have the following directory structure:

```txt
> my-project
  > cypress
  > src
  > reporters
    - custom.js
```

Specify the path to your custom reporter to use it:

`cypress.json`:

```json
{
  "reporter": "reporters/custom.js"
}
```

Command line:

```shell
cypress run --reporter reporters/custom.js
```

## npm Reporters

If you have installed a custom reporter through npm, specify the package name:

```json
// cypress.json
{
  "reporter": "mochawesome"
}
```

Command line:

```shell
cypress run --reporter mochawesome
```

{% note info Peer Dependencies %}
You need to install any peer dependencies the reporter requires, even if they're bundled with Cypress. For example, [mochawesome](https://github.com/adamgruber/mochawesome) requires `mocha` as a peer dependency. You will need to install mocha as a dev dependency of your own project for it to work (`npm install mocha --save-dev`).
{% endnote %}

# Reporter Options

Some reporters accept options to customize their behavior. These can be specified in your `cypress.json` or via the command line:

```json
// cypress.json
{
  "reporter": "junit",
  "reporterOptions": {
    "mochaFile": "results/my-test-output.xml",
    "toConsole": true
  }
}
```

Command line:

```shell
cypress run --reporter junit --reporter-options "mochaFile=results/my-test-output.xml,toConsole=true"
```

Reporter options differ depending on the reporter (and may not be supported at all). Refer to the documentation for the reporter you are using for details on which options are supported.
