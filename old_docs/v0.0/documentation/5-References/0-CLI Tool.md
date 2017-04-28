slug: cli
excerpt: Cypress CLI Tool for programmatically interacting with the Desktop Application

# Contents

- :fa-angle-right: [What is the CLI Tool?](#section-what-is-the-cli-tool-)
- :fa-angle-right: [Installation](#section-installation)
- :fa-angle-right: [Available Commands](#section-available-commands)
  - [cypress install](#section--cypress-install-)
  - [cypress update](#section--cypress-update-)
  - [cypress run](#section--cypress-run-)
  - [cypress run --record](cli#section--cypress-run-record-)
  - [cypress open](#section--cypress-open-)
  - [cypress get:path](#section--cypress-get-path-)
  - [cypress verify](#section--cypress-verify-)
  - [cypress version](#section--cypress-version-)

***

# What is the CLI Tool?

The CLI Tool is an [`npm package`](https://github.com/cypress-io/cypress-cli) that wraps the Desktop Application.

It provides a set of commands that can be used to do things like:

- Install Cypress
- Run Cypress headlessly
- Record your test runs
- Output the current installed version

[block:callout]
{
  "type": "info",
  "body": "You generally install the CLI tool so you can progamatically install and run Cypress. This is commonly used when running Cypress from your CI provider."
}
[/block]

***

# Installation

```shell
npm install -g cypress-cli
```

This will make the `cypress` command globally available from your command line.

You can now execute the following commands:

***

# Available Commands

## `cypress install`

Installs the **Cypress Desktop Application** to the default location for each Operating System.

OS | Path
:--- | :---
Mac  | `/Applications/Cypress.app`
Linux  | `/home/<user>/.cypress/Cypress`

```shell
## by default will install the latest version
cypress install
```

```shell
## install a specific version
cypress install --cypress-version 0.13.0
```

Additionally if you have a `CYPRESS_VERSION` environment variable set, it will automatically download that version. This is most useful when running Cypress in CI.

![cypress-cli](https://cloud.githubusercontent.com/assets/1268976/14435124/4f632278-ffe4-11e5-9dab-0a2d493551b3.gif)

***

## `cypress update`

Updates Cypress to the latest version. This does the same thing as `cypress install`.

```shell
## now we have the latest version
cypress update
```

***

## `cypress run`

Runs Cypress headlessly without spawning a browser.

You can use this command when working locally or when running in [Continuous Integration](https://on.cypress.io/guides/continuous-integration).

Cypress will first check to see that the Desktop Application is installed and will automatically install it prior to running (if necessary).

[block:callout]
{
  "type": "success",
  "title": "Want your test runs recorded?",
  "body": "You can also have Cypress record your test runs and make them available on our [Dashboard](https://on.cypress.io/guides/dashboard-features)."
}
[/block]

```shell
## by default will use your current path
cypress run
```

```shell
## or you can specify a path to the project
cypress run /users/john/projects/TodoMVC
```

```shell
## specify a port to use which overrides values in cypress.json
cypress run --port 8080
```

```shell
## specify a mocha reporter to use
cypress run --reporter json
```

```shell
## specify options for the mocha reporter
cypress run --reporter-options mochaFile=result.xml,toConsole=true
```

```shell
## specify a file to run instead of running all the tests files
cypress run --spec cypress/integration/app_spec.js
```

```shell
## specify environment variables
cypress run --env host=api.dev.local
```

```shell
## specify configuration values to override cypress.json
cypress run --config pageLoadTimeout=100000,watchForFileChanges=false
```

You can read more about [environment variables](https://on.cypress.io/environment-variables) and [configuration](https://on.cypress.io/configuration) here.

***

## `cypress run --record`

You can also have your test runs recorded [once your project is setup to record](https://on.cypress.io/guides/projects).

[block:callout]
{
  "type": "info",
  "body": "You'd typically record your runs in [Continuous Integration](https://on.cypress.io/guides/continuous-integration), but you can also record when running locally."
}
[/block]

After setting up your project you will recieve a **Record Key**.

```shell
cypress run --record --key <record_key>
```

If you set this **Record Key** as an environment variable you can omit the `--key` flag.

```shell
## you'd typically set this in your CI provider
export CYPRESS_RECORD_KEY=abc-key-123

## we can now omit --key
cypress run --record
```

You can [read more](https://on.cypress.io/how-do-i-record-runs) about recording runs here.

***

## `cypress open`

Opens the Cypress application. This is the same thing as double-clicking the application.

In Mac you'll see the **cy** icon in the dock and in Linux you'll see the Cypress application window open.

Arguments you pass to `cypress open` will automatically be applied to the projects you open. These persist onto all projects until you quit the Cypress Desktop Application.

```shell
## specify a port to use which overrides values in cypress.json
cypress open --port 8080
```

```shell
## specify configuration values which override cypress.json
cypress open --config pageLoadTimeout=100000,watchForFileChanges=false
```

```shell
## specify environment variables
cypress open --env host=api.dev.local
```

***

## `cypress get:path`

Returns the path Cypress will be installed to. Additionally checks to see if Cypress already exists at that path.

***

## `cypress verify`

Verifies that the Cypress application is found.

***

## `cypress version`

Outputs both the version of the CLI Tool and the installed Cypress application.
