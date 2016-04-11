slug: installing-and-running
excerpt: Quick start guide for using Cypress

# Contents

- :fa-angle-right: [System Requirements](#section-system-requirements)
- :fa-angle-right: [Installing](#section-installing)
  - [Command Line](#section-command-line-tool)
  - [Direct Download](#section-direct-download)
- :fa-angle-right: [Adding Projects](#section-adding-projects)
- :fa-angle-right: [Running Headlessly](#section-running-headlessly)

***

# System Requirements

Cypress is a desktop application. This desktop application is the equivalent replacement of Selenium Server and must be running to test in Cypress.


[block:callout]
{
  "type": "info",
  "body": "The desktop application will mostly be used to login, add new projects, and update. Most of your testing will be done in the **browser**, not the desktop application"
}
[/block]

The desktop application can be installed in the following operating systems:

| Operating System |
| ------ |
| Linux |
| OSX |

Windows is [*(not yet working)*](https://github.com/cypress-io/cypress/issues/74)

There are no dependencies to install the Desktop Application, although if you want to [use Cypress from the Command Line](https://github.com/cypress-io/cypress-cli) you will need to have `node` installed.

***

# Installing

You can install Cypress in 2 different ways:
* [Cypress CLI Tool](https://github.com/cypress-io/cypress-cli)
* Direct download

## Command Line Tool

```shell
## install the Cypress CLI tool
npm install -g cypress-cli

## install the Desktop Cypress app
cypress install
```

![cypress-cli](https://cloud.githubusercontent.com/assets/1268976/14435124/4f632278-ffe4-11e5-9dab-0a2d493551b3.gif)

[block:callout]
{
  "type": "info",
  "body": "The Cypress CLI Tool contains many additional options such as installing a specific Cypress version.\n\nSee [the Cypress CLI Docs](https://github.com/cypress-io/cypress-cli#installation).",
  "title": "Cypress CLI"
}
[/block]

## Direct Download

You can download Cypress directly [here.](http://download.cypress.io/desktop)

[block:callout]
{
  "type": "danger",
  "body": "The vast majority of the time, Cypress will install correctly. But if you're on Linux you [might have to install some other dependencies](https://on.cypress.io/guides/troubleshooting#section-installation).",
  "title": "Woops, I got an error installing"
}
[/block]

***

# Adding Projects

After installing, you will need to add the project(s) you want to write Cypress tests in.

- Open the Cypress App -- just double click the app from you OS application's folder.
- Authorize GitHub access to your account*
- Add your project directory to Cypress by clicking :fa-plus:.
- Click on the project. You should see a `Server Running` message.
- Click on the `http://localhost:2020` link.

** *Note: this requires direct authorization from the Cypress team during Beta to allow your account email*

![project](https://cloud.githubusercontent.com/assets/1268976/9286780/adad94b8-42c9-11e5-9a67-df7abb87fac0.gif)

After adding your project to Cypress, Cypress will generate a `cypress.json` file in your project:

```text
<your project>/cypress.json
```

This file contains your unique `projectId` and allows for specific Cypress [configuration](https://on.cypress.io/guides/configuration).

It is okay to commit this file to `git`.

***

# Running Headlessly

While you'll find yourself working primarily in the GUI, it is helpful to be able to run your tests headlessly.

Once you have the [Cypress CLI Tool](https://github.com/cypress-io/cypress-cli) installed, you can simply execute:

```bash
cypress run
```

Additionally you can specify:

- a single test file
- a specific reporter
- a different port
- environment variables

You can [read about all of these options](https://github.com/cypress-io/cypress-cli#cypress-run-1) which are documented on the Cypress CLI tool.