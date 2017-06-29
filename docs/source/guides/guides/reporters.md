---
title: Reporters
comments: false
---

Cypress supports the following reporters:

* {% url "Mocha's built-in reporters" https://mochajs.org/#reporters %}
* {% url "`teamcity`" https://github.com/cypress-io/mocha-teamcity-reporter %}
* {% url "`junit`" https://github.com/michaelleeallen/mocha-junit-reporter %}
* {% urlHash "Custom reporters" Custom-Reporters %}

# Custom Reporters

Cypress supports custom reporters, whether local to your project or installed through {% url "npm" https://www.npmjs.com/ %}.

## Local Reporters

Say you have the following directory structure:

```txt
> my-project
  > cypress
  > src
  > reporters
    - custom.js
```

***To specify the path to your custom reporter:***

```javascript
// cypress.json

{
  "reporter": "reporters/custom.js"
}
```

***Command line***

```shell
cypress run --reporter reporters/custom.js
```

## npm Reporters

If you installed a custom reporter through npm, specify the package name:

```javascript
// cypress.json

{
  "reporter": "mochawesome"
}
```

***Command line***

```shell
cypress run --reporter mochawesome
```

{% note info  %}
You need to install any peer dependencies the reporter requires, even if they're bundled with Cypress. For example, {% url "mochawesome" https://github.com/adamgruber/mochawesome %} requires `mocha` as a peer dependency. You will need to install `mocha` as a dev dependency of your own project for it to work (`npm install mocha --save-dev`).
{% endnote %}

# Options

Some reporters accept options that customize their behavior. These can be specified in your `cypress.json` or via the command line:

```javascript
// cypress.json

{
  "reporter": "junit",
  "reporterOptions": {
    "mochaFile": "results/my-test-output.xml",
    "toConsole": true
  }
}
```

***Command line***

```shell
cypress run --reporter junit --reporter-options "mochaFile=results/my-test-output.xml,toConsole=true"
```

Reporter options differ depending on the reporter (and may not be supported at all). Refer to the documentation for the reporter you are using for details on which options are supported.
