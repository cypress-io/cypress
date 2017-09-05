---
title: Command Line
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How to run Cypress headlessly from the command line
- How to record your tests running from the command line
- How to output the current installed version from the command line
{% endnote %}

# Installation

This makes the `cypress` commands available and {% url "installs the Cypress Desktop Application" installing-cypress %} matching your package's version.

```shell
npm install cypress
```

# Available Commands

## `cypress run`

Run Cypress headlessly without spawning a browser. You can use this command when working locally or when {% url 'running Cypress in CI' continuous-integration %}.

***Run tests***

```shell
cypress run [project] [options]
```

**Project**

***Run tests specifying path to the project***

```shell
cypress run /users/john/projects/TodoMVC
```

**Options**

Option | Description
------ |  ---------
`-b`, `--browser`  | Specify name of browser to run tests in
`-c`, `--config`  | Specify configuration
`-e`, `--env`  | Specify environment variables
`-h`, `--help`  | Output usage information
`-k`, `--key`  | Specify your secret record key
`-p`, `--port`  | Override default port
`--record`  | Whether to record the test run
`-r`, `--reporter`  | Specify a mocha reporter
`-o`, `--reporter-options`  | Specify mocha reporter options
`-s`, `--spec`  | A single test file to run instead of all tests

***Run tests specifying browser***

```shell
cypress run --browser chrome
```

***Run tests specifying configuration***

Read more about {% url 'environment variables' environment-variables %} and {% url 'configuration' configuration %}.

```shell
cypress run --config pageLoadTimeout=100000,watchForFileChanges=false
```

***Run tests specifying environment variables***

```shell
cypress run --env host=api.dev.local
```

***Run tests specifying a port***

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

***Run and record video of tests***

Record video of tests running after {% url 'setting up your project to record' projects-dashboard#Set-up-a-Project-to-Record %}. After setting up your project you will be given a **Record Key**.

```shell
cypress run --record --key <record_key>
```

If you set the **Record Key** as the environment variable `CYPRESS_RECORD_KEY`, you can omit the `--key` flag.

**Set environment variable (typically in {% url 'Continuous Integration' continuous-integration %}).**

```shell
export CYPRESS_RECORD_KEY=abc-key-123
```

**Omit `--key` flag when env var set.**

```shell
cypress run --record
```

You can {% url 'read more about recording runs here' projects-dashboard#Set-up-a-Project-to-Record %}.

## `cypress open`

Open the Cypress GUI application. This is the same thing as double-clicking the application.

***Open Cypress***

```shell
cypress open [options]
```

**Options**

Options passed to `cypress open` will automatically be applied to the project you open. These persist on all projects until you quit the Cypress Desktop Application. These options will also override values in `cypress.json`

Option | Description
------ | ---------
`-c`, `--config`  | Specify configuration
`-d`, `--detached` | Open Cypress in detached mode
`-e`, `--env`  | Specify environment variables
`-h`, `--help`  | Output usage information
`-p`, `--port`  | Override default port


***Open Cypress projects specifying port***

```shell
cypress open --port 8080
```

***Open Cypress projects specifying configuration***

```shell
cypress open --config pageLoadTimeout=100000,watchForFileChanges=false
```

***Open Cypress projects specifying environment variables***

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

Verify that Cypress is installed correctly and executable.

```shell
cypress verify
```

***Example Output***

```shell
Cypress application is valid and should be okay to run: /Applications/Cypress.app
```

## `cypress version`

Output both the version of the the installed Cypress NPM package and binary application.

```shell
cypress version
```

***Example Output***

```shell
Cypress package version: 0.20.0
Cypress binary version: 0.20.0
```

If the binary has not been installed yet, or has been deleted, it will print

```shell
Cypress package version: 0.20.0
Cypress binary version: unavailable
```
