---
title: Installing Cypress
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How to install Cypress on your project using `npm`
- How to run Cypress via the command line
- How to version and automate Cypress via `package.json`

{% endnote %}

# Installing Cypress via `npm`

Installing Cypress is easy:

```shell
cd /your/project/path
npm install cypress --save-dev
```

This will install Cypress locally for this project, which is ideal for a few reasons:
- Cypress is a versioned dependency like any other
- Multiple versions of Cypress can co-exist on the same machine on a per-project basis
- Simplifies things when you're setting up Continuous Integration

{% note info What is `npm`? %}
If you've never set up a NodeJS project before, this is all probably a bit confusing! We recommend heading over to [the NodeJS website](https://nodejs.org/) and digging in, we'll wait.
{% endnote %}

{% note danger Windows: Coming Soon %}
A big, hearty thanks to all of our patient early adopters avidly awaiting the development of the Windows version of Cypress! If this is you, feel free to follow {% issue 74 'this issue' %} to be notified when Windows support lands.
{% endnote %}

# Running Cypress via the CLI

Cypress has now been installed to our `./node_modules` directory, with its binary executable accessible from `./node_modules/.bin`. This means we can call it from our project root like so:

```bash
# the long way with the full path
./node_modules/.bin/cypress open
# same, shortcut using `npm bin`
$(npm bin)/cypress open
```

After a moment, the Cypress graphical application will launch. If this is your first time running Cypress in this project, it will generate some files to help you get started. These files live in the new `./cypress` directory (also generated for you), and are very user friendly so don't be afraid have a look through them!

![Cypress First Run Experience](/img/guides/generated-files.png)

# Managing Cypress with `package.json`

Take a look at your `package.json` file, which is where `npm` is configured for your project.

## Versioning Cypress

You should see that Cypress has been added as a development dependency versioned to the latest available version. If you need to install a specific version of Cypress, you can do so by modifying this version string and running `npm install`.

```json
{
  "devDependencies": {
    "cypress": "^0.20.0"
  }
}
```

## Automating Cypress

In order to run Cypress easily, we recommend having `npm` execute a simple script for you. Do this by adding a `scripts` key to `package.json` with a nested key for the name of the script. For starters, name this script `test`, and have it simply call `cypress open`:

```json
{
  "scripts": {
    "test": "cypress open"
  }
}
```

Now you can invoke this command like so:

```shell
npm test
```

...and Cypress will open right up for you!
