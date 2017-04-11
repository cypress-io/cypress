slug: installing-and-running
excerpt: Quick start guide for using Cypress

# Contents

- :fa-angle-right: [System Requirements](#system-requirements)
- :fa-angle-right: [Installing](#installing)
  - [Command Line](#command-line-tool)
  - [Direct Download](#direct-download)
- :fa-angle-right: [Logging In](#logging-in)
- :fa-angle-right: [Adding Projects](#adding-projects)
- :fa-angle-right: [Running Headlessly](#running-headlessly)

***

# System Requirements

Cypress is a desktop application. This desktop application is the equivalent replacement of Selenium Server and must be running to test in Cypress.


[block:callout]
{
  "type": "info",
  "body": "The desktop application manages your local projects. The actual testing will be done in a **browser**, not the desktop application"
}
[/block]

The desktop application can be installed in the following operating systems:

| Operating System |
| ------ |
| Linux |
| OSX |

Windows is [(not yet working)](https://github.com/cypress-io/cypress/issues/74).

There are no dependencies to install the Desktop Application, although if you want to [use Cypress from the Command Line](https://github.com/cypress-io/cypress-cli) you will need to have `node` installed.

***

# Installing

You can install Cypress in 2 different ways:
* [Cypress CLI Tool](https://github.com/cypress-io/cypress-cli)
* [Direct Download](#direct-download)

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
  "body": "The Cypress CLI Tool contains many additional options such as installing a specific Cypress version.\n\nSee the [Cypress CLI Docs](https://github.com/cypress-io/cypress-cli#installation).",
  "title": "Cypress CLI"
}
[/block]

## Direct Download

You can download Cypress directly [here.](http://download.cypress.io/desktop)

[block:callout]
{
  "type": "danger",
  "body": "The vast majority of the time, Cypress will install correctly. But if you're on Linux you [might have to install some other dependencies](https://on.cypress.io/guides/continuous-integration#dependencies).",
  "title": "Woops, I got an error installing"
}
[/block]

***

# Logging In

After installing, you will need to login to Cypress. Login currently requires a [Github](https://github.com/) account, if you do not have an account, you will have to [create one](https://github.com/join) to use Cypress.

**To Login:**

- Open the Cypress App -- just double click the app from your OS application's folder.
- Click "Log In with GitHub".
- Authorize GitHub access to your account.

![Log In to Cypress](https://cloud.githubusercontent.com/assets/1271364/18134962/38a6c3d8-6f6e-11e6-998b-9884496cb898.png)

## Your email: `jane.doe@gmail.com` has not been authorized.

While in beta, the Cypress team has to whitelist the email address associated with your GitHub account in order for you to use Cypress.

- If you received this error and have never filled out our [Early Adopter Access](http://goo.gl/forms/4vEMwj8LNT) form, fill out this form with the email in the error so we can whitelist it. You will receive an invite during one of our future Beta invites.
- If you received this error after receiving a Beta invite email from Cypress, please send an email to **support@cypress.io** telling us the email in the error so we can whitelist it.

***

# Adding Projects

After successfully logging in, you will need to add the project(s) you want to write Cypress tests in.

- Click :fa-plus: Add Project.

![Add Project in LeftHand Corner](https://cloud.githubusercontent.com/assets/1271364/22699969/fe44c2e4-ed26-11e6-83d0-9baa0f51b15e.png)

[block:callout]
{
  "type": "info",
  "body": "Projects added in our Desktop Application are strictly local to your computer. They are not tracked in any way by Cypress servers and do not communicate with us until they are [setup to be recorded](https://on.cypress.io/guides/projects#recording-runs)."
}
[/block]

***

# Running Tests from the GUI

To run tests:

- Click on the project.
- You will then come to a page listing all files in your project's `cypress/integration` folder. If it's a new project, you'll see a message about the folder structure generated for you and also an `example_spec.js` file.
- Click on the test file you want to run or click "Run All Tests".
- After opening your project in Cypress, Cypress will generate a `cypress.json` file in your project:

```text
<your project>/cypress.json
```

This file contains a unique `projectId` and allows for specific Cypress [configuration](https://on.cypress.io/guides/configuration). It is okay to commit this file to `git`.

***

# Running Headlessly

While you'll find yourself working primarily in the GUI, it is helpful to be able to run your tests headlessly.

Once you have the [Cypress CLI Tool](https://github.com/cypress-io/cypress-cli) installed, you can simply execute:

```shell
cypress run
```

Additionally you can specify:

- a single test file
- [a specific reporter and reporter options](https://on.cypress.io/guides/reporters)
- a different port
- environment variables

You can [read about all of these options](https://github.com/cypress-io/cypress-cli#cypress-run-1) which are documented on the Cypress CLI tool.
