---
title: Command Line
comments: false
---

The CLI Tool is an [`npm package`](https://github.com/cypress-io/cypress-cli) that wraps the Desktop Application.

It provides a set of commands that can be used to:

- Install Cypress
- Run Cypress headlessly
- Record your tests running
- Output the current installed version

{% note info  %}
Installing the CLI tool allows you to programmatically install and run Cypress. This is commonly used when {% url 'running Cypress in CI' continuous-integration %}.
{% endnote %}

# Installation

This makes the `cypress` commands globally available from your command line.

```shell
npm install -g cypress-cli
```

# Available Commands

## `cypress install`

Install the **Cypress Desktop Application** to the default location for your Operating System.

OS | Path
:--- | :---
Mac  | `/Applications/Cypress.app`
Linux  | `/home/<user>/.cypress/Cypress`
Windows  | {% issue 74 'not currently supported' %}

***Install the latest version***

```shell
cypress install
```

***Install a specific version***
```shell
cypress install --cypress-version 0.13.0
```

Additionally if you have a `CYPRESS_VERSION` environment variable set, it will automatically download that version. This is most useful when {% url 'running Cypress in CI' continuous-integration %}.

![cypress-cli](https://cloud.githubusercontent.com/assets/1268976/14435124/4f632278-ffe4-11e5-9dab-0a2d493551b3.gif)

## `cypress update`

Update Cypress to the latest version. This is the as `cypress install`.

```shell
cypress update
```

## `cypress run`

Run Cypress headlessly without spawning a browser.

You can use this command when working locally or when {% url 'running Cypress in CI' continuous-integration %}.

Cypress checks to see that the Desktop Application is installed and automatically installs it prior to running (if necessary).

***Run tests from current path***

```shell
cypress run
```

***Run tests specifying path to the project***

```shell
cypress run /users/john/projects/TodoMVC
```

***Run tests specifying a port (overrides values in `cypress.json`)***

```shell
cypress run --port 8080
```

***Run tests specifying a mocha reporter***

```shell
cypress run --reporter json
```

***Run tests specifying mochas reporter options***

```shell
cypress run --reporter-options mochaFile=result.xml,toConsole=true
```

***Run tests specifying a single test file to run instead of all tests***

```shell
cypress run --spec cypress/integration/app_spec.js
```

***Run tests specifying environment variables***

```shell
cypress run --env host=api.dev.local
```

***Run tests specifying configuration (overrides values in `cypress.json`)***

```shell
cypress run --config pageLoadTimeout=100000,watchForFileChanges=false
```
{% note info  %}
Read more about {% url 'environment variables' environment-variables %} and {% url 'configuration' configuration %}.
{% endnote %}

## `cypress run --record`

Record video of tests running after {% url 'setting up your project to record' projects-dashboard#Set-up-a-Project-to-Record %}.

{% note info  %}
You'd typically record your runs in {% url 'Continuous Integration' continuous-integration %}, but you can also record when running locally.
{% endnote %}

After setting up your project you will be given a **Record Key**.

***Run and record tests specifying record key***

```shell
cypress run --record --key <record_key>
```

If you set the **Record Key** as the environment variable `CYPRESS_RECORD_KEY`, you can omit the `--key` flag.

***Set environment variable (typically in {% url 'Continuous Integration' continuous-integration %}).***

```shell
export CYPRESS_RECORD_KEY=abc-key-123
```

***Omit `--key` flag when env var set.***

```shell
cypress run --record
```

You can {% url 'read more about recording runs here' projects-dashboard#Set-up-a-Project-to-Record %}.

## `cypress open`

Open the Cypress GUI application. This is the same thing as double-clicking the application.

Arguments you pass to `cypress open` will automatically be applied to the project you open. These persist on all projects until you quit the Cypress Desktop Application.

***Open Cypress projects specifying port (overrides values in `cypress.json`)***

```shell
cypress open --port 8080
```

***Open Cypress projects specifying configuration (overrides values in `cypress.json`)***

```shell
cypress open --config pageLoadTimeout=100000,watchForFileChanges=false
```

***Open Cypress projects specifying environment variables (overrides values in `cypress.json`)***

```shell
cypress open --env host=api.dev.local
```

## `cypress get:path`

Get the path Cypress will be installed to. Additionally checks to see if Cypress already exists at that path.

```shell
cypress get:path
```

***Example Output***

```shell
Path to Cypress: /Applications/Cypress.app
Cypress was found at this path.
```

## `cypress verify`

Verify that the Cypress application is found.

```shell
cypress verify
```

***Example Output***

```shell
Cypress application is valid and should be okay to run: /Applications/Cypress.app
```

## `cypress version`

Output both the version of the CLI Tool and the installed Cypress application.

```shell
cypress version
```

***Example Output***

```shell
Cypress CLI: 0.13.1
Cypress App: 0.19.2
```
