# Contributing to Cypress

Thanks for taking the time to contribute! :smile:

**Once you learn how to use Cypress, you can contribute in many ways:**

- Join the [Cypress Gitter chat](https://gitter.im/cypress-io/cypress) and answer questions. Teaching others how to use Cypress is a great way to learn more about how it works.
- Blog about Cypress. We display blogs featuring Cypress on our [Examples](https://on.cypress.io/examples) page. If you'd like your blog featured, [contact us](mailto:support@cypress.io).
- Write some documentation or improve our existing docs. Know another language? You can help us translate them. See our [guide to contributing to our docs](https://github.com/cypress-io/cypress-documentation/blob/master/CONTRIBUTING.md).
- Give a talk about Cypress. [Contact us](mailto:support@cypress.io) ahead of time and we'll send you some swag. :shirt:

**Want to dive deeper into how Cypress works? There are several ways you can help with the development of Cypress:**

- [Report bugs](https://github.com/cypress-io/cypress/issues/new) by opening an issue.
- [Request features](https://github.com/cypress-io/cypress/issues/new) by opening an issue.
- Write code for one of our core packages. [Please thoroughly read our writing code guide](#writing-code).

## Table of Contents

- [CI Status](#ci-status)
- [Code of Conduct](#code-of-conduct)
- [Opening Issues](#opening-issues)
- [Triaging Issues](#triaging-issues)
- [Writing Documentation](#writing-documentation)
- [Writing Code](#writing-code)
  - [What you need to know before getting started](#what-you-need-to-know-before-getting-started)
  - [Requirements](#requirements)
  - [Getting Started](#getting-started)
  - [Coding Style](#coding-style)
  - [Tests](#tests)
  - [Packages](#packages)
- [Committing Code](#committing-code)
  - [Branches](#branches)
  - [Pull Requests](#pull-requests)
  - [Testing](#testing)
- [Deployment](#deployment)

## CI status

Build status | Description
:--- | :---
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-test-node-versions.svg?style=svg&circle-token=6a7c4e7e7ab427e11bea6c2af3df29c4491d2376)](https://circleci.com/gh/cypress-io/cypress-test-node-versions) | [cypress-test-node-versions](https://github.com/cypress-io/cypress-test-node-versions)
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-test-ci-environments.svg?style=svg&circle-token=66a4d36c3966cbe476f13e7dfbe3af0693db3fb9)](https://circleci.com/gh/cypress-io/cypress-test-ci-environments) | [cypress-test-ci-environments](https://github.com/cypress-io/cypress-test-ci-environments)
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-test-module-api.svg?style=svg&circle-token=317f79ae796e0ffd6cc7dd90859c0f67e5a306e7)](https://circleci.com/gh/cypress-io/cypress-test-module-api) | [cypress-test-module-api](https://github.com/cypress-io/cypress-test-module-api)
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-test-nested-projects.svg?style=svg)](https://circleci.com/gh/cypress-io/cypress-test-nested-projects) | [cypress-test-nested-projects](https://github.com/cypress-io/cypress-test-nested-projects)
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-on.svg?style=svg&circle-token=51ba85f5720654ee58212f45f6b9afc56d55d52a)](https://circleci.com/gh/cypress-io/cypress-on) | [cypress-on](https://github.com/cypress-io/cypress-on)
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-test-node-versions.svg?style=svg&circle-token=6a7c4e7e7ab427e11bea6c2af3df29c4491d2376)](https://circleci.com/gh/cypress-io/cypress-test-node-versions) | [cypress-test-example-repos](https://github.com/cypress-io/cypress-test-example-repos)
[![CircleCI](https://circleci.com/gh/cypress-io/docsearch-scraper.svg?style=svg&circle-token=8087137233788ec1eab4f79d4451392ca53183b2)](https://circleci.com/gh/cypress-io/docsearch-scraper) | [docsearch-scraper](https://github.com/cypress-io/docsearch-scraper)
[![Docker Build Status](https://img.shields.io/docker/build/cypress/base.svg)](https://hub.docker.com/r/cypress/base/) | [cypress-docker-images](https://github.com/cypress-io/cypress-docker-images)
[![Build status](https://ci.appveyor.com/api/projects/status/ln8tg3dv42nk916c?svg=true)](https://ci.appveyor.com/project/cypress-io/cypress) | Windows CI

## Code of Conduct

All contributors are expecting to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Opening Issues

**The most important things to do are:**

- Search existing [issues](https://github.com/cypress-io/cypress/issues) for your problem.
- Understand our [roadmap](https://on.cypress.io/roadmap).
- Check the list of [common fixes](#common-fixes) below.
- [Gather debugging information](#getting-more-information).
- [Describe your problem, not your solution](#describe-problems)
- [Explain how to reproduce the issue](#reproducibility).

Finally, if you are up to date, supported, have collected information about the problem, and have the best reproduction instructions you can come up with, you are ready to [open an issue](https://github.com/cypress-io/cypress/issues/new).

### Common Fixes

Before filing a bug, make sure you are up to date. Your issue may have already been fixed. Even if you do not see the issue described as resolved in a newer version, a newer version may help in the process of debugging your issue by giving more helpful error messages.

[See our document on installing cypress](https://on.cypress.io/installing-cypress)

### Getting more information

For some issues, there are places you can check for more information. This may help you resolve the issue yourself. Even if it does not, this information can help us figure out and resolve an issue.

- For issues in the web browser, check the JavaScript console and your Network tab in your DevTools.
- Click on any command in the Command Log where the failure occurred, this will log more information about the error to the JavaScript console.
- Use Cypress [`debug`](https://on.cypress.io/debug) or [`pause`](https://on.cypress.io/pause) commands to step through your commands.
- Ask other Cypress users for help in our [chat](https://on.cypress.io/chat).

### Describe Problems

When you file a feature request, we need you to **describe the problem you are facing first**, not just your desired solution.

Often, your problem may have a lot in common with other similar problems. If we understand your use case, we can compare it to other use cases and sometimes find a more powerful or more general solution which solves several problems at once. Understanding the root issue can let us merge and contextualize things. Sometimes there's already a way to solve your problem that might just not be obvious.

Also, your proposed solution may not be compatible with the direction we want to take the product, but we may be able to come up with another solution which has approximately the same effect and does fit into the product direction.

### Reproducibility

**It is nearly impossible for us to resolve many issues if we can not reproduce them. Your best chance of getting a bug looked at quickly is to provide a repository with a reproducible bug that can be cloned and run.**

## Triaging Issues

When an issue is opened in [cypress](https://github.com/cypress-io/cypress), we need to evaluate the issue to determine what steps should be taken next. So, when approaching new issues, there are some steps that should be taken.

### 1. Is this already an open issue?

Search [all issues](https://github.com/cypress-io/cypress/issues) for keywords from the issue to ensure there isn't already an issue open for this. GitHub has some [search tips](https://help.github.com/articles/searching-issues-and-pull-requests/) that may help you better find the relevant issue.

### 2. Is what they are describing actually happening?

The best way to determine the validity of a bug is to recreate it yourself. Follow the directions or information provided to recreate the bug that is described. Did they provide a repository that demonstrates the bug? Great - fork it and run the project and steps required. If they did not provide a repository, the best way to reproduce the issue is to have a 'sandbox' project up and running locally for Cypress. This is just a simple project with Cypress installed where you can freely edit the application under test and the tests themselves to recreate the problem.

**Attempting to recreate the bug will lead to a few scenarios:**

#### 1. You can not recreate the bug

Leave a comment on the issue saying, "I can't reproduce this situation with the code you provided. Could you provide more information or a repository demonstrating the bug?"

#### 2. You can recreate the bug

Leave a comment on the issue saying "I was able to reproduce this in Cypress version x.x.x" If you know where the code is that could possibly fix this issue - link to the file or line of code from the [cypress](https://github.com/cypress-io/cypress) repo and remind the user that we are open source and that we gladly accept PRs, even if they are a work in progress.

#### 3. You can tell the problem is a user error

In recreating the issue, you may realize that they had a typo or used the Cypress API incorrectly, etc. Leave a comment informing the user of their error and close the issue – or ask them to close the issue if it fixes their problem.

## Writing Documentation

Cypress documentation lives in a separate repository with its own dependencies and build tools.
See [Documentation Contributing Guideline](https://github.com/cypress-io/cypress-documentation/blob/master/CONTRIBUTING.md).

## Writing code

Working on your first Pull Request? You can learn how from this free series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

### What you need to know before getting started

#### Cypress and Packages

Cypress is a large open source project. When you want to contribute to Cypress, you may be unsure which part of the project to work within.

This repository is made up of various packages. They are discrete modules with different responsibilities, but each is necessary for the Cypress app and is not necessarily useful outside of the Cypress app.

Here is a list of the core packages in this repository with a short description, located within the [`packages`](./packages) directory:

 Folder Name | Purpose
 ----------- | -------
[cli](./cli) | The command-line tool that is packaged as an `npm` module.
[coffee](./packages/coffee) | A centralized version of CoffeeScript used for other packages.
[desktop-gui](./packages/desktop-gui) | The front-end code for the Cypress Desktop GUI.
[driver](./packages/driver) | The code that is used to drive the behavior of the API commands.
[electron](./packages/electron) | The Cypress implementation of Electron.
[example](./packages/example) | Our example kitchen-sink application.
[extension](./packages/extension) | The Cypress Chrome browser extension
[https-proxy](./packages/https-proxy) | This does https proxy for handling http certs and traffic.
[launcher](./packages/launcher) | Finds and launches browsers installed on your system.
[reporter](./packages/reporter) | The reporter shows the running results of the tests (The Command Log UI).
[root](./packages/root) | Dummy package pointing at the root of the repository.
[runner](./packages/runner) | The runner is the minimal "chrome" around the user's application under test.
[server](./packages/server) | The <3 of Cypress. This orchestrates everything. The backend node process.
[socket](./packages/socket) | A wrapper around socket.io to provide common libraries.
[static](./packages/static) | Serves static assets used in the Cypress GUI.
[ts](./packages/ts) | A centralized version of typescript.

We try to tag all issues with a `pkg/` tag describing the appropriate package the work is required in. For example, the [`pkg/driver`](https://github.com/cypress-io/cypress/labels/pkg%2Fdriver) label is tagged on issues that require work in the `driver` package.

### Requirements

You must have [`node`](https://nodejs.org/en/) and [`npm`](https://www.npmjs.com/) installed to run the project. We use [avn](https://github.com/wbyoung/avn), a utility to switch to the right npm version, in each folder. Currently, Cypress should be developed using the version specified in root [.node-version](.node-version) file.

### Getting Started

**Install all dependencies:**

```bash
npm install
```

This will install this repo's direct dependencies as well as the dependencies for every individual package.

**Then, build all the packages and start the app:**

```bash
npm run build
npm start
```

If there are errors building the packages, prefix the commands with `DEBUG=cypress:*` to see more details.

This outputs a lot of debugging lines. To focus on an individual module, run with `DEBUG=cypress:launcher` for instance.

When running `npm start` this routes through the CLI and eventually calls `npm run dev` with the proper arguments. This enables Cypress day-to-day development to match the logic of the built binary + CLI integration.

If you want to bypass the CLI entirely, you can use the `npm run dev` task and pass arguments directly.

#### Tasks

Each package is responsible for building itself and testing itself and can do so using whatever tools are appropriate, but each conforms to a standard set of npm scripts so that building, watching, testing, etc. can be orchestrated from the root of this repo. Here are the npm scripts supported and what they mean:

Task | Purpose
---- | -------
`build` | Build the package
`build-prod` | Build all assets for production (if makes sense)
`start` | Run a server for serving files
`watch` | Watch source files and build development assets when they are saved. This may also run a server for serving files and run tests related to a saved file.
`clean` | Remove any assets created by `build-dev` or `build-prod`
`clean-deps` | Remove any dependencies installed (usually by `npm`)
`test` | Runs all tests once
`test-watch` | Run all tests in watch mode

Not every package requires or makes use of every script, so it is simply omitted from that package's `package.json` and not run.

You can run `npm run all <script name>` from the root directory to run a script in every package that utilizes that script. Many times, you may only be working on one or two packages at a time, so it won't be necessary or desirable to run a script for every package. You can use the `--packages` option to specify in which package(s) to run the script.

You can even run `npm run all install` to install all npm dependencies for each package. Note that this is already done automatically for you when you run `npm install`.

```bash
npm run all watch-dev -- --packages core-desktop-gui
```

Separate the package names with commas to specify multiple packages:

```bash
npm run all watch-dev -- --packages core-desktop-gui,core-runner
```

By default, all tasks run in parallel. This is faster than running serially, but the output ends up mixed together and, if things go wrong, it can be difficult see where the error occurred. To run tasks serially, use the `--serial` flag:


```bash
npm run all build-prod -- --serial
```

*build-prod* will be run sequentially for every package, so the output for each package won't be jumbled with the output of the others.

It is not recommended to use `--serial` with any script that is long-running, like *watch-dev* or *test*, since they need to be parallel.

#### Debugging

Some packages use [debug](https://github.com/visionmedia/debug#readme) to
log debug messages to the console. The naming scheme should be
`cypress:<package name>`. For example to see launcher messages during unit
tests start it using

```bash
cd packages/launcher
DEBUG=cypress:launcher npm test
```

If you want to see log messages from all Cypress projects use wild card

```bash
DEBUG=cypress:*
```

Or for an individual package:

```bash
DEBUG=cypress:cli
DEBUG=cypress:server
DEBUG=cypress:launcher
```

### Coding Style

We use [eslint](https://eslint.org/) to lint all JavaScript code and follow rules specified in
[eslint-plugin-cypress-dev](https://github.com/cypress-io/eslint-plugin-cypress-dev) plugin.

### Tests

For most packages there are typically unit and some integration tests.

Our true e2e tests are in `packages/server`, which test the full stack all together.

Please refer to each packages' `README.md` which documents how to run tests. It is not feasible to try to run all of the tests together. We run our entire test fleet across over a dozen containers in CI.

If you're curious how we manage all of these tests in CI check out our [`circle.yml`](circle.yml) file found in the root `cypress` directory.

#### Docker

Sometimes tests pass locally, but fail on CI. Our CI environment should be
dockerized. In order to run the same image locally, there is script
[scripts/run-docker-local.sh](scripts/run-docker-local.sh) that assumes that you
have pulled the image `cypress/internal:chrome61` (see
[circle.yml](circle.yml) for the current image name).

The image will start and will map the root of the repository to
`/cypress` inside the image. Now you can modify the files using your
favorite environment and rerun tests inside the docker environment.

**hint** sometimes building inside the image has problems with `node-sass` library

```text
Error: Missing binding /cypress/packages/desktop-gui/node_modules/node-sass/vendor/linux-x64-48/binding.node
Node Sass could not find a binding for your current environment: Linux 64-bit with Node.js 6.x

Found bindings for the following environments:
  - OS X 64-bit with Node.js 6.x

This usually happens because your environment has changed since running `npm install`.
Run `npm rebuild node-sass` to build the binding for your current environment.
```

From the running container, go into that project and rebuild `node-sass`

```bash
$ npm run docker
cd packages/desktop-gui
npm rebuild node-sass
```

### Packages

Generally when making contributions, you are typically making them to a small number of packages. Most of your local development work will be inside a single package at a time.

Each package documents how to best work with it, so simply consult the `README.md` of each package.

They will outline development and test procedures. When in doubt just look at the `scripts` of each `package.json` file. Everything we do at Cypress is contained there.

## Committing Code

### Branches

The repository is setup with two main (protected) branches.

- `master` is the code already published in the last Cypress version.
- `develop` is the current latest "edge" code. This branch is set as the default branch, and all pull requests should be made against this branch.

### Pull Requests

- When opening a PR for a specific issue already open, please name the branch you are working on using convention `issue-[issue number]`. For example, if your PR fixes Issue #803, name your branch `issue-803`.
- Please use the `address #[issue number]` or `closes #[issue number]` syntax in the pull request description.
- Please check the "Allow edits from maintainers" checkbox when submitting your PR. This will make it easier for the maintainers to make minor adjustments, to help with tests or any other changes we may need.
![Allow edits from maintainers checkbox](https://user-images.githubusercontent.com/1271181/31393427-b3105d44-ada9-11e7-80f2-0dac51e3919e.png)

### Testing

This repository is exhaustively tested by [CircleCI](https://circleci.com/gh/cypress-io/cypress). Additionally we test the code by running it against various other example projects. See CI badges and links at the top of this document.

To run local tests, consult the `README.md` of each package.

## Deployment

We will try to review and merge pull requests quickly. After merging we
will try releasing a new version. If you want to know our build process or
build your own Cypress binary, read [DEPLOY.md](DEPLOY.md)
