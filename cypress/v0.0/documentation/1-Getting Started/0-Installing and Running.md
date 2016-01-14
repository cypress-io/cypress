excerpt: Quick start guide for using Cypress
slug: installing-and-running

## System Requirements

Cypress comes packaged as a standard desktop application. This desktop application is the equivalent replacement of `Selenium Server` and must be running for Cypress to work correctly.

> **Note:** Not to worry, you will do all your work and programming in the **browser**, not the desktop application.

The desktop application can be installed in the following operating systems:

| Operating System |
| ------ |
| Linux |
| OSX |
| [Windows *(not yet working)*](https://github.com/cypress-io/cypress/issues/74) |

There are no depedencies to install the Desktop Application, although if you want to [use Cypress from the Command Line](https://github.com/cypress-io/cypress-cli) you'll need to have `node` installed.

## Installing

You can install Cypress:
* From the command Line
* By direct download

#### From the command line

```bash
## install the Cypress CLI tool
npm install -g cypress

## install the Desktop Cypress app
cypress install
```

![cypress-install](https://cloud.githubusercontent.com/assets/1268976/9279271/5c3826ba-4284-11e5-969b-91b0c27a8dee.gif)

#### Direct Download

You can download Cypress directly [here.](http://download.cypress.io/latest)

#### I got an error installing

The vast majority of the time Cypress will just install correctly. But if you're on linux you [might have to install some other dependencies](http://on.cypress.io/guides/troubleshooting#installation).

## Adding Projects

* Open the Cypress App -- just double click the app here: `/Applications/Cypress.app`.
* Authorize GitHub access to your account (**Note: this requires direct authorization from the Cypress team during Beta to allow your account email.**)
* Add your project directory into Cypress by clicking the `+` icon.
* Click on the project, and you'll see the `Server is Running` message.
* Click on `http://localhost:2020`.

![project](https://cloud.githubusercontent.com/assets/1268976/9286780/adad94b8-42c9-11e5-9a67-df7abb87fac0.gif)

After adding your project to Cypress, Cypress will generate a `cypress.json` file here:

```
/cypress.json
```

This file contains your unique `projectId`, and any specific Cypress configuration you add.

It is okay to commit this file to `git`.

## Writing Tests

After adding your project, Cypress will automatically scaffold out a suggested folder structure. By default it will create:

```
/tests
/tests/_fixtures
/tests/_support
```

> **Note:** You can modify this configuration in your `cypress.json`.

#### Test Files

Test files may be written as either `.js` or `.coffee` files.

To get started, simply create a new file: `tests/app_spec.js`

Cypress will now list this spec file inside of Cypress, and will run the tests within it.

#### How to write tests

Cypress is built on top of [`Mocha`](http://on.cypress.io/guides/bundled-tools#mocha) and uses its `bdd` interface. Therefore tests you write in Cypress will adhere to this style.

If you're familiar with writing tests in JavaScript, then writing tests in Cypress will be a breeze.

We are working on an introduction video, and many new example repos for you to look at.

Currently you can [check out the examples here](http://on.cypress.io/guides/all-example-apps).

## Command Line Tools

Cypress can also be orchestrated headlessly from the command line. You can use the [CLI tools](https://github.com/cypress-io/cypress-cli) to do things like:

- Run Headlessly
- Run in CI
- Install Cypress

The [documentation for this tool is here](https://github.com/cypress-io/cypress-cli).