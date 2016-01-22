slug: installing-and-running
excerpt: Quick start guide for using Cypress

# Contents

- :fa-angle-right: [System Requirements](#section-system-requirements)
- :fa-angle-right: [Installing](#section-installing)
  - :fa-angle-right: [Command Line](#section-command-line)
  - :fa-angle-right: [Direct Download](#section-direct-download)
- :fa-angle-right: [Adding Projects](#section-adding-projects)

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
* From a command line interface
* By direct download

## Command Line

```bash
# install the Cypress CLI tool
npm install -g cypress

# install the Desktop Cypress app
cypress install
```

![cypress-install](https://cloud.githubusercontent.com/assets/1268976/9279271/5c3826ba-4284-11e5-969b-91b0c27a8dee.gif)

## Direct Download

You can download Cypress directly [here.](http://download.cypress.io/latest)

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

* Open the Cypress App -- just double click the app from you OS application's folder.
* Authorize GitHub access to your account (**Note: this requires direct authorization from the Cypress team during Beta to allow your account email.**)
* Add your project directory to Cypress by clicking :fa-plus:.
* Click on the project. You should see a `Server Running` message.
* Click on the `http://localhost:2020` link.

![project](https://cloud.githubusercontent.com/assets/1268976/9286780/adad94b8-42c9-11e5-9a67-df7abb87fac0.gif)

After adding your project to Cypress, Cypress will generate a `cypress.json` file in your project:

```
/cypress.json
```

This file contains your unique `projectId` and allows for specific Cypress [configuration](https://on.cypress.io/guides/configuration).

It is okay to commit this file to `git`.