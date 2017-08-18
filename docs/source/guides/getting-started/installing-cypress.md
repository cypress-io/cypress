---
title: Installing Cypress
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How to install the Cypress Desktop Application

{% endnote %}

# System Requirements

Cypress is a desktop application that is locally installed on your computer.

{% note info %}
The desktop application manages your local projects. The actual testing will be done in a **browser**, not the desktop application.
{% endnote %}

The desktop application can be installed in the following operating systems:

OS | Path
:--- | :---
Mac  | `/Applications/Cypress.app`
Linux  | `/home/<user>/.cypress/Cypress`
Windows  | {% issue 74 'not currently supported' %}

There are no dependencies to install the Desktop Application, although if you want to {% url "use Cypress from the command line" https://www.npmjs.com/package/cypress %} you will need to have {% url "`node`" https://nodejs.org %} installed.

# Installing

You can install Cypress in 2 different ways:

* {% url "Install Cypress via npm" command-line %}
* {% urlHash "Direct Download" Direct-Download %}

## {% fa fa-terminal %} Install Cypress via npm

Installing Cypress using npm allows you to install Cypress per project. This also allows you to maintain specific versions of Cypress per project.

```shell
npm install cypress
```

{% note info %}
The cypress npm package contains many additional options such as installing a specific Cypress version. See the {% url "CLI Tool Docs" command-line#cypress-install %}.
{% endnote %}

## {% fa fa-download %} Direct Download

You can {% url "download Cypress directly here" http://download.cypress.io/desktop %}.

## Continuous Integration

{% note warning "I'm trying to install Cypress in CI" %}
Please read our {% url 'Continuous Integration' continuous-integration %} docs for help installing Cypress in CI. When running in linux you'll need to install some {% url 'system dependencies' continuous-integration#Dependencies %}.
{% endnote %}

# Logging In

After installing, you will need to log in to Cypress. Logging in currently requires a {% url "Github" https://github.com/ %} account, if you do not have an account, you will have to {% url "create one" https://github.com/join %} to use Cypress.

***To Login:***

- Open the Cypress App -- just double click the app from your OS application's folder.
- Click **Log In with GitHub**.
- Authorize GitHub access to your account.

{% img no-border /img/guides/log-in-to-cypress-screen.png Log In to Cypress %}
