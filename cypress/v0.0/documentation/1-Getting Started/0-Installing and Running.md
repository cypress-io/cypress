slug: installing-and-running
excerpt: Quick start guide for using Cypress

# Contents

- :fa-angle-right: [System Requirements](#section-system-requirements)
- :fa-angle-right: [Installing](#section-installing)
  - [Command Line](#section-command-line-tool)
  - [Direct Download](#section-direct-download)
- :fa-angle-right: [Logging In](#section-logging-in)
- :fa-angle-right: [Adding Projects](#section-adding-projects)
- :fa-angle-right: [Running Headlessly](#section-running-headlessly)

***

# System Requirements

Cypress is a desktop application. This desktop application is the equivalent replacement of Selenium Server and must be running to test in Cypress.


[block:callout]
{
  "type": "info",
  "body": "The desktop application manages your local projects. The actual testing will be done in the **browser**, not the desktop application"
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

# Logging In

After installing, you will need to login to Cypress. Login requires a [Github](https://github.com/) account, if you do not have an account, you will have to [create one](https://github.com/join) to use Cypress.

**To Login:**

- Open the Cypress App -- just double click the app from your OS application's folder.
- Click "Login with Github".
- Authorize GitHub access to your account

![screen shot 2016-04-14 at 3 19 13 pm](https://cloud.githubusercontent.com/assets/1271364/14540715/6f0ba86c-0254-11e6-9cb7-962827ec0a07.png)

## Your email: `john.doe@gmail.com` has not been authorized.

While in beta, the Cypress team will need to whitelist your Github email in order for you to use Cypress.

- If you received this error and have never filled out our [Early Adopter Access](http://goo.gl/forms/4vEMwj8LNT) form, fill out this form with the email in the error so we can whitelist it. You will receive an invite during one of our future Beta invites.
- If you received this error after receiving a Beta invite email from Cypress, please send an email to **support@cypress.io** telling us the email in the error so we can whitelist it.

***

# Adding Projects

After successfully logging in, you will need to add the project(s) you want to write Cypress tests in.

- Add the parent directory of your project to Cypress by clicking :fa-folder-o: in the top-right corner.

***

# Running Tests from the GUI

To run tests:

- Click on the project. You should see a `Server Running` message.
- Click on the `Run in Chrome` button or select another browser to run the tests in (if available).

![project](https://cloud.githubusercontent.com/assets/1268976/9286780/adad94b8-42c9-11e5-9a67-df7abb87fac0.gif)

A new browser window will open and take you to a page listing the Integration Test files.

If it's a new project, you'll see a message about the folder structure generated for you and also an example_spec.js file.

![screen shot 2016-05-04 at 1 33 07 pm](https://cloud.githubusercontent.com/assets/1271364/15023087/d51eb7ae-11fc-11e6-8e8a-bef2690e4924.png)

Go ahead and click on the example_spec.js file to see some example tests run. After running your project in Cypress, Cypress will generate a `cypress.json` file in your project:

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