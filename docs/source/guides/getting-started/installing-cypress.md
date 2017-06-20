---
title: Installing Cypress
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How to install the Cypress Desktop Application
- How to run Cypress via the command line
- How to version and automate Cypress via `package.json`

{% endnote %}

# System Requirements

Cypress is a desktop application. This desktop application is the equivalent replacement of Selenium Server and must be running to test in Cypress.

{% note info %}
The desktop application manages your local projects. The actual testing will be done in a **browser**, not the desktop application
{% endnote %}

The desktop application can be installed in the following operating systems:


OS | Path
:--- | :---
Mac  | `/Applications/Cypress.app`
Linux  | `/home/<user>/.cypress/Cypress`
Windows  | {% issue 74 'not currently supported' %}

There are no dependencies to install the Desktop Application, although if you want to {% url "use Cypress from the Command Line" https://github.com/cypress-io/cypress-cli %} you will need to have `node` installed.

# Installing

You can install Cypress in 2 different ways:

* {% url "Cypress CLI Tool" command-line %}
* {% urlHash "Direct Download" Direct-Download %}

## Command Line Tool

**Install the Cypress CLI tool**

```shell
npm install -g cypress-cli
```

**Install the Desktop Cypress app**

```shell
cypress install
```

![cypress-cli](https://cloud.githubusercontent.com/assets/1268976/14435124/4f632278-ffe4-11e5-9dab-0a2d493551b3.gif)

{% note info %}
The Cypress CLI Tool contains many additional options such as installing a specific Cypress version. See the {% url "CLI Tool Docs" command-line#cypress-install %}.
{% endnote %}


## Direct Download

You can download Cypress directly {% url "here" http://download.cypress.io/desktop %}.

{% note danger "Woops, I got an error installing" %}
The vast majority of the time, Cypress will install correctly. But if you're on Linux you {% url "might have to install some other dependencies" continuous-integration#Other %}.
{% endnote %}

# Logging In

After installing, you will need to login to Cypress. Login currently requires a {% url "Github" https://github.com/ %} account, if you do not have an account, you will have to {% url "create one" https://github.com/join %} to use Cypress.

**To Login:**

- Open the Cypress App -- just double click the app from your OS application's folder.
- Click "Log In with GitHub".
- Authorize GitHub access to your account.

![Log In to Cypress](https://cloud.githubusercontent.com/assets/1271364/18134962/38a6c3d8-6f6e-11e6-998b-9884496cb898.png)

## Your email has not been authorized.

While in beta, the Cypress team has to whitelist the email address associated with your GitHub account in order for you to use Cypress.

- If you received this error and have never filled out our {% url "Early Adopter Access form" http://goo.gl/forms/4vEMwj8LNT %}, fill out this form with the email in the error so we can whitelist it. You will receive an invite during one of our future Beta invites.
- If you received this error after receiving a Beta invite email from Cypress, please send an email to **support@cypress.io** telling us the email in the error so we can whitelist it.
