slug: continuous-integration
excerpt: Run Cypress in any CI provider

## Requirements

Cypress should *just work* for all mainstream CI providers with only **2 lines of code**.

However, if you're running on your own `Jenkins` server you may have to install some other dependencies [which are documented here](http://on.cypress.io/guides/troubleshooting).

## Supported Services

Cypress should run on **all** CI providers. We currently have seen Cypress run on the following providers:

- Jenkins (Linux)
- TravisCI
- CircleCI
- CodeShip
- GitLab

## Running in CI

Running Cypress in CI is super easy. If you're using a hosted CI service generally the workflow is always the same:

1. [Add your project's repo to your CI provider](#add-your-project-to-your-ci-provider)
2. [Acquire your Cypress secret key](#acquire-your-cypress-secret-key)
3. [Add 2 lines of code to your CI config file](#add-2-lines-of-code-to-your-ci-config-file)

#### Add your project to your CI provider

This is different for each provider, but usually includes logging into your CI service, connecting it with your Github account, and then adding that project's repo.

#### Acquire your Cypress secret key

Cypress verifies your project is allowed to run in CI by a secret key. This key can only be obtained from the CLI tool (currently).

Run this command from your terminal:

```bash
## this will return your secret key
cypress get:key
```

```bash
## you'll see a key that looks like this
703b33d9-a00e-4c66-90c2-40efc0fee2c6
```

![get-key](https://cloud.githubusercontent.com/assets/1268976/9291525/8ea13f28-4393-11e5-955e-1a41fee12f5f.gif)

**Note:**
> `cypress get:key` expects your `pwd` to be that of your project.

#### Add 2 lines of code to your CI config file

Depending on which CI provider you're using you'll have access to a configuration file such as:

- `.travis.yml`
- `circle.yml`

You'll only need to add two lines of code to this file.

```bash
## this will install the cypress-cli tools
npm install -g cypress


## this will run tests headlessly
cypress ci <your-secret-key>
```

You'll want to refer to your CI providers documentation for knowing when to run those commands. Generally each CI provider gives you a lifecyle of build commands.

For instance, with [Travis CI](https://docs.travis-ci.com/user/customizing-the-build/#The-Build-Lifecycle) they expose a `before_install` and `install` phase. You'd write `npm install -g cypress` in the `before_install` phase, and `cypress ci` in the `install` phase.

#### Storing your secret key as an environment variable

Instead of hard-coding your secret key into a configuration file, you can opt to store this as an environment variable with your CI provider. Each CI provider will be different, but generally each exposes a way to set environment variables.

Set the name of the environment variable to `CYPRESS_CI_KEY` and paste your secret key as the value.

#### Specifying a version of Cypress

You can specify a specific version of Cypress to use in CI by setting an Environment Variable: `CYPRESS_VERSION`.

As long as a previous version was not removed (due to security issues) this will work.

## Examples

We are working on publicizing more examples but you can see a fully working project in TravisCI here:

- [TravisCI](https://github.com/cypress-io/examples-react-travis-ci#4-run-in-travis-ci)

![travis-logs](https://cloud.githubusercontent.com/assets/1268976/9291527/8ea21024-4393-11e5-86b7-80e3b5d1047e.gif)

