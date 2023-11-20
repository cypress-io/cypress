# Contributing to Cypress

Thanks for taking the time to contribute! :smile:

**Once you learn how to use Cypress, you can contribute in many ways:**

- Join the [Cypress Discord](https://on.cypress.io/chat) and answer questions. Teaching others how to use Cypress is a great way to learn more about how it works.
- Blog about Cypress. We display blogs featuring Cypress on our [Examples](https://on.cypress.io/examples) page. If you'd like your blog featured, [open a PR to add it to our docs](https://github.com/cypress-io/cypress-documentation/blob/master/CONTRIBUTING.md#adding-examples).
- Write some documentation or improve our existing docs. See our [guide to contributing to our docs](https://github.com/cypress-io/cypress-documentation/blob/master/CONTRIBUTING.md).
- Give a talk about Cypress. [Contact us](mailto:support@cypress.io) ahead of time and we'll send you some swag. :shirt:

**Want to dive deeper into how Cypress works? There are several ways you can help with the development of Cypress:**

- [Report bugs](https://github.com/cypress-io/cypress/issues/new) by opening an issue.
- [Request features](https://github.com/cypress-io/cypress/issues/new) by opening an issue.
- [Help triage existing issues](#triaging-issues).
- Write code to address an issue. We have some issues labeled as [`good first issue`](https://github.com/cypress-io/cypress/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) that are a good place to start. Please thoroughly read our [Writing Code guide](#writing-code).

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Opening Issues](#opening-issues)
- [Writing Documentation](#writing-documentation)
- [Writing Code](#writing-code)
  - [What you need to know before getting started](#what-you-need-to-know-before-getting-started)
  - [Requirements](#requirements)
  - [Getting Started](#getting-started)
  - [Coding Style](#coding-style)
  - [Adding links within code](#Adding-links-within-code)
  - [Tests](#tests)
  - [Packages](#packages)
- [Committing Code](#committing-code)
  - [Branches](#branches)
  - [Pull Requests](#pull-requests)
  - [Dependencies](#dependencies)
- [Reviewing Code](#reviewing-code)
  - [Some rules about Code Review](#Some-rules-about-Code-Review)
  - [Steps to take during Code Review](#Steps-to-take-during-Code-Review)
  - [Code Review Checklist](#Code-Review-Checklist)
  - [Code Review of Dependency Updates](#Code-Review-of-Dependency-Updates)
- [Deployment](#deployment)

## Code of Conduct

All contributors are expected to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Opening Issues

**The most important things to do are:**

- Search existing [issues](https://github.com/cypress-io/cypress/issues) for your problem.
- Understand our [roadmap](https://on.cypress.io/roadmap).
- [Update Cypress](#update-cypress).
- [Gather debugging information](#getting-more-information).
- [Fill out the provided issue template](#fill-out-our-issue-template).
- [Describe your problem, not your solution](#describe-problems)
- [Explain how to reproduce the issue](#reproducibility).

Finally, if you are up to date, supported, have collected information about the problem, and have the best reproduction instructions you can give, you are ready to [open an issue](https://github.com/cypress-io/cypress/issues/new/choose).

### Update Cypress

Before filing a bug, make sure you are up to date. Your issue may have already been fixed. Even if you do not see the issue described as resolved in a newer version, a newer version may help in the process of debugging your issue by giving more helpful error messages.

[See our document on installing cypress](https://on.cypress.io/installing-cypress)

### Getting more information

For some issues, there are places you can check for more information. This may help you resolve the issue yourself. Even if it doesn't, this information can help us figure out and resolve an issue.

- For issues in the web browser, check the JavaScript console and your Network tab in your DevTools.
- Click on any command in the Command Log where the failure occurred, this will log more information about the error to the JavaScript console.
- Use Cypress [`debug`](https://on.cypress.io/debug) or [`pause`](https://on.cypress.io/pause) commands to step through your commands.
- Ask other Cypress users for help in our [chat](https://on.cypress.io/chat) or [Discord](https://on.cypress.io/discord).
- Try more advanced troubleshooting from [troubleshooting Cypress](https://on.cypress.io/debugging#Troubleshooting-Cypress) doc.

### Fill out our Issue Template

When opening an issue, there is a provided issue template. Fill out the information according to the template. This is information needed for Cypress to continue forward with your problem. Any issues that don't fill out the issue template will be closed.

### Describe Problems

When you file a feature request or bug, it's best to **describe the problem you are facing first**, not just your desired solution.

Often, your problem may have a lot in common with other similar problems. If we understand your use case, we can compare it to other use cases and sometimes find a more powerful or more general solution which solves several problems at once. Understanding the root issue can let us merge and contextualize things. Sometimes there's already a way to solve your problem that might just not be obvious.

Also, your proposed solution may not be compatible with the direction we want to take the product, but we may be able to come up with another solution which has approximately the same effect and does fit into the product direction.

### Reproducibility

**It is nearly impossible for us to resolve issues if we can not reproduce them. Your best chance of getting a bug looked at quickly is to provide a repository with a reproducible bug that can be cloned and run.**

## Common issues

Label | Description | Issues
--- | --- | ---
browser detection | Local browser is not detected | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20browser%20detection), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+browser+detection%22+is%3Aclosed)
cross-origin | Getting cross-origin error | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20cross-origin%20%E2%A4%AD), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+cross-origin+%E2%A4%AD%22+is%3Aclosed)
cy.request | Issues related to cy.request command | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20cy.request), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+cy.request%22+is%3Aclosed)
fixtures | Fixture loading and usage | | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20fixtures), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+fixtures%22+is%3Aclosed)
hooks | Issues related to hooks | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20hooks%20%E2%86%AA), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+hooks+%E2%86%AA%22+is%3Aclosed)
iframes | Working with iframes | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20iframes), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+iframes%22+is%3Aclosed)
installation | Cypress cannot be downloaded or installed |  [open](https://github.com/cypress-io/cypress/labels/topic%3A%20installation), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+installation%22+is%3Aclosed)
network | Controlling network requests |  [open](https://github.com/cypress-io/cypress/labels/topic%3A%20network), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+network%22+is%3Aclosed)
performance | Slow loading, slow network, etc | [open](https://github.com/cypress-io/cypress/labels/type%3A%20performance%20%F0%9F%8F%83%E2%80%8D%E2%99%80%EF%B8%8F), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22type%3A+performance+%F0%9F%8F%83%E2%80%8D%E2%99%80%EF%B8%8F%22+is%3Aclosed)
screenshots | Taking image screenshots | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20screenshots%20%F0%9F%93%B8), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+screenshots+%F0%9F%93%B8%22+is%3Aclosed)
scrolling | Scrolling elements into view |  [open](https://github.com/cypress-io/cypress/labels/topic%3A%20scrolling%20%E2%86%95%EF%B8%8F), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+scrolling+%E2%86%95%EF%B8%8F%22+is%3Aclosed)
spec execution | Running all specs or some specs in some specific order |  [open](https://github.com/cypress-io/cypress/labels/topic%3A%20spec%20execution) | [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+spec+execution%22+is%3Aclosed)
test execution | Running tests inside a single spec | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20test%20execution), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+test+execution%22+is%3Aclosed)
typescript | Transpiling or bundling TypeScript | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20typescript), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+typescript%22+is%3Aclosed)
video | Problems with video recordings | [open](https://github.com/cypress-io/cypress/labels/topic%3A%20video%20%F0%9F%93%B9), [closed](https://github.com/cypress-io/cypress/issues?q=label%3A%22topic%3A+video+%F0%9F%93%B9%22+is%3Aclosed)


## Writing Documentation

Cypress documentation lives in a separate repository with its own dependencies and build tools.
See [Documentation Contributing Guidelines](https://github.com/cypress-io/cypress-documentation/blob/master/CONTRIBUTING.md).

## Writing code

Working on your first Pull Request? You can learn how from this free series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

### What you need to know before getting started

#### Cypress and Packages

Cypress is a large open source project. When you want to contribute to Cypress, you may be unsure which part of the project to work within.

Cypress uses a monorepo, which means there are many independent packages in this repository. There are two main types of packages: private and public.

Private packages included in the app generally live within the [`packages`](./packages) directory and are in the `@packages/` namespace. These packages are combined to form the main Cypress app that you get when you `npm install cypress`. They are discrete modules with different responsibilities, but each is necessary for the Cypress app and is not necessarily useful outside of the Cypress app. Since these modules are all compiled and bundled into a binary upon release, they are sometimes collectively referred to as the Cypress binary.

Here is a list of the core packages in this repository with a short description, located within the [`packages`](./packages) directory:

 | Folder Name                           | Package Name            | Purpose                                                                      |
 | :------------------------------------ | :---------------------- | :--------------------------------------------------------------------------- |
 | [cli](./cli)                          | `cypress`               | The command-line tool that is packaged as an `npm` module.                   |
 | [app](./packages/app)           | `@packages/app`      | The front-end for the Cypress App that renders in the launched browser instance.             |
 | [config](./packages/config)           | `@packages/config`      | The Cypress configuration types and validation used in the server, data-context and driver.             |
 | [data-context](./packages/data-context)           | `@packages/data-context`      | Centralized data access for the Cypress application.             |
 | [driver](./packages/driver)           | `@packages/driver`      | The code that is used to drive the behavior of the API commands.             |
 | [electron](./packages/electron)       | `@packages/electron`    | The Cypress implementation of Electron.                                      |
 | [errors](./packages/errors)           | `@packages/errors`      | Error definitions and utilities for Cypress                                  |
 | [example](./packages/example)         | `@packages/example`     | Our example kitchen-sink application.                                        |
 | [extension](./packages/extension)     | `@packages/extension`   | The Cypress Chrome browser extension                                         |
 | [frontend-shared](./packages/frontend-shared)     | `@packages/frontend-shared`   | Shared components and styles used in the `app` and `launchpad`.                                         |
 | [graphql](./packages/graphql)     | `@packages/graphql`   | The GraphQL layer that the `launchpad` and `app` use to interact with the `server`.                                  |
 | [https-proxy](./packages/https-proxy) | `@packages/https-proxy` | This does https proxy for handling http certs and traffic.                   |
 | [icons](./packages/icons)       | `@packages/icons`    | The Cypress icons.                        |
 | [launcher](./packages/launcher)       | `@packages/launcher`    | Finds and launches browsers installed on your system.                        |
 | [launchpad](./packages/launchpad)       | `@packages/launcher`    | The portal to running Cypress that displays in `open` mode.                        |
 | [net-stubbing](./packages/net-stubbing) | `@packages/net-stubbing` | Contains server side code for Cypress' network stubbing features.         |
 | [network](./packages/network)         | `@packages/network`     | Various utilities related to networking.                                     |
 | [packherd-require](./packages/packherd-require) | `@packages/packherd-require` | Loads modules that have been bundled by `@tooling/packherd`.  |
 | [proxy](./packages/proxy)             | `@packages/proxy`       | Code for Cypress' network proxy layer.                                       |
 | [reporter](./packages/reporter)       | `@packages/reporter`    | The reporter shows the running results of the tests (The Command Log UI).    |
 | [resolve-dist](./packages/resolve-dist)       | `@packages/resolve-dist`    | Centralizes the resolution of paths to compiled/static assets from server-side code..    |
 | [rewriter](./packages/rewriter)       | `@packages/rewriter`    | The logic to rewrite JS and HTML that flows through the Cypress proxy.
 | [root](./packages/root)               | `@packages/root`        | Dummy package pointing at the root of the repository.                        |
 | [runner](./packages/runner)           | `@packages/runner`      | (deprecated) The runner is the minimal "chrome" around the user's application under test. |
 | [scaffold-config](./packages/scaffold-config)           | `@packages/scaffold-config`      | The logic related to scaffolding new projects using launchpad.   |
 | [server](./packages/server)           | `@packages/server`      | The <3 of Cypress. This orchestrates everything. The backend node process.   |
 | [socket](./packages/socket)           | `@packages/socket`      | A wrapper around socket.io to provide common libraries.                      |
 | [ts](./packages/ts)                   | `@packages/ts`          | A centralized version of typescript.                                         |
 | [types](./packages/types)             | `@packages/types`          | The shared internal Cypress types.                                         |
 | [v8-snapshot-require](./packages/v8-snapshot-require) | `@packages/v8-snapshot-require` | Tool to load a snapshot for Electron applications that was created by `@tooling/v8-snapshot`. |
 | [web-config](./packages/web-config)             | `@packages/web-config`          | The web-related configuration.                                         |

Private packages involved in development of the app live within the [`tooling`](./tooling) directory and are in the `@tooling/` namespace. They are discrete modules with different responsibilities, but each is necessary for development of the Cypress app and is not necessarily useful outside of the Cypress app.

Here is a list of the packages in this repository with a short description, located within the [`tooling`](./tooling) directory:

 | Folder Name                           | Package Name            | Purpose                                                                      |
 | :------------------------------------ | :---------------------- | :--------------------------------------------------------------------------- |
 | [electron-mksnapshot](./electron-mksnapshot) | `electron-mksnapshot` | A rewrite of [electron/mksnapshot](https://github.com/electron/mksnapshot) to support multiple versions. |
 | [packherd](./tooling/packherd)        | `packherd`              | Herds all dependencies reachable from an entry and packs them.               |
 | [v8-snapshot](./tooling/v8-snapshot)  | `v8-snapshot`           | Tool to create a snapshot for Electron applications.                         |

Public packages live within the [`npm`](./npm) folder and are standalone modules that get independently published to npm under the `@cypress/` namespace. These packages generally contain extensions, plugins, or other packages that are complementary to, yet independent of, the main Cypress app.

Here is a list of the npm packages in this repository:

 | Folder Name                                            | Package Name                       | Purpose                                                                      |
 | :----------------------------------------------------- | :--------------------------------- | :--------------------------------------------------------------------------- |
 | [angular](./npm/angular)                               | `@cypress/angular`                   | Cypress component testing for Angular.     |
 | [create-cypress-tests](./npm/create-cypress-tests)     | `@cypress/create-cypress-tests`    | Tooling to scaffold Cypress configuration and demo test files. |
 | [eslint-plugin-dev](./npm/eslint-plugin-dev)           | `@cypress/eslint-plugin-dev`       | Eslint plugin for internal development.          |
 | [grep](./npm/grep)                                       | `@cypress/grep`                     | Filter tests using substring                        |
 | [mount-utils](./npm/mount-utils)                       | `@cypress/mount-utils`             | Common functionality for Vue/React/Angular adapters. |
 | [react](./npm/react)                                   | `@cypress/react`                   | Cypress component testing for React.             |
 | [react18](./npm/react18)                               | `@cypress/react18`                   | Cypress component testing for React 18.           |
 | [schematic](./npm/cypress-schematic)                   | `@cypress/schematic`            | Official Angular Schematic and Builder for the Angular CLI.|
 | [svelte](./npm/svelte)                               | `@cypress/svelte`                   | Cypress component testing for Svelte.           |
 | [vite-dev-server](./npm/vite-dev-server)     | `@cypress/vite-dev-server`    | Vite powered dev server for Component Testing.                  |
 | [vue](./npm/vue)                                       | `@cypress/vue`                     | Cypress component testing for Vue 3.               |
 | [vue2](./npm/vue2)                                       | `@cypress/vue2`                     | Cypress component testing for Vue 2.               |
 | [webpack-batteries-included-preprocessor](./npm/webpack-batteries-included-preprocessor)     | `@cypress/webpack-batteries-included-preprocessor`    | Cypress preprocessor for bundling JavaScript via webpack with dependencies included and support for various ES features, TypeScript, and CoffeeScript.  |
 | [webpack-dev-server](./npm/webpack-dev-server)     | `@cypress/webpack-dev-server`    | Webpack powered dev server for Component Testing.                |
 | [webpack-preprocessor](./npm/webpack-preprocessor)     | `@cypress/webpack-preprocessor`    | Cypress preprocessor for bundling JavaScript via webpack.  |

We try to tag all issues with a `pkg/` or `npm/` tag describing the appropriate package the work is required in. For public packages, we use their qualified package name: For example, issues relating to the  webpack preprocessor are tagged under [`npm: @cypress/webpack-preprocessor`](https://github.com/cypress-io/cypress/labels/npm%3A%20%40cypress%2Fwebpack-preprocessor) label and issues related to the `driver` package are tagged with the [`pkg/driver`](https://github.com/cypress-io/cypress/labels/pkg%2Fdriver) label.

### Requirements

You must have the following installed on your system to contribute locally:

- [`Node.js`](https://nodejs.org/en/) (See the root [.node-version](.node-version) file for the required version. You can find a list of tools on [node-version-usage](https://github.com/shadowspawn/node-version-usage) to switch the version of [`Node.js`](https://nodejs.org/en/) based on [.node-version](.node-version).)
- [`yarn`](https://yarnpkg.com/en/docs/install)
- [`python`](https://www.python.org/downloads/) (since we use `node-gyp`. See their [repo](https://github.com/nodejs/node-gyp) for Python version requirements.)
  - Note for Debian-based systems: `python` is pre-installed.<br>`sudo apt install g++ make cmake` meets the additional requirements to run `node-gyp` in the context of building Cypress from source.

### Getting Started

The project utilizes [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and leverages [lerna](https://lerna.js.org/) to orchestrate running within the context of one or more packages. While it is not as important to understand lerna or yarn workspaces, it **is important** to note that running scripts or installing new dependencies should always happen from the repo's root directory.

> **⚠ Running on Windows?**
>
> If you are running a Windows operating system, you may encounter some commands that are not working. In order to resolve paths correctly during the development build process, you may need to explicitly set your default `yarn` shell script to Command Prompt by using the following command:
>```bash
> yarn config set script-shell "C:\\Windows\\system32\\cmd.exe"
>```

**Install all dependencies:**

```bash
yarn
```

This will install all the dependencies for the repo and perform a preliminary build.

**Next, start the app:**

```bash
yarn start
```

If there are errors building the packages, prefix the commands with `DEBUG=cypress:*` to see more details. This outputs a lot of debugging lines. To focus on an individual module, run with `DEBUG=cypress:launcher:*` for instance. See ["Debug logs"](./guides/debug-logs.md) for more info.

When running `yarn start` this routes through the CLI and eventually calls `yarn dev` with the proper arguments. This enables Cypress day-to-day development to match the logic of the built binary + CLI integration.

CLI flags can be passed to `yarn` targets to control application behavior when running locally. For example, to headlessly run a project in a given folder, while trying to record to Cypress Cloud:

```text
yarn cypress:run --project /project/folder --record --key <key>
```

Alternatively, you can run `yarn dev` at the root of this repository to bypass the CLI. This will launch "global" mode, where you can then select a project.

#### Adding new Dependencies

⚠️ There is a [bug in yarn](https://github.com/yarnpkg/yarn/issues/7734) that may cause issues adding a new dependency to a workspace. You can avoid this by downgrading yarn to 1.19.1 (temporarily downgrade using `npx yarn@1.19.1 workspace @packages/server add my-new-dep1`).

```shell
# add a new dep to the root of the repo
$ yarn add -W my-new-dep1

# add a new dep to a specific package
$ yarn workspace @packages/server add my-new-dep1
$ yarn workspace @packages/server add --dev my-new-dep1
```

Alternatively, you can directly add the dependency to the corresponding `package.json` and run `yarn`.

#### Tasks

> Scripts are intended to be **run** from the **root of the repo**. **Do not install dependencies or run scripts from within a sub-directory.**

##### Common Top Level Tasks

By default, top level tasks will execute for all packages. However, most scripts can be provided one or more scopes. Providing a scope will execute tasks within the provided packages. Scope values are based on **package names** and not the directory structure.

| Task               | Purpose                                                          |
| :----------------- | :--------------------------------------------------------------- |
| `build`            | Compile non-node code (typescript)                               |
| `start`            | Open Cypress in dev and global mode                              |
| `watch`            | Auto-rebuild on file changes                                     |
| `clean`            | Remove build artifacts                                           |
| `clean-deps`       | Remove all installed dependencies (in root and in every package) |
| `test`             | Run the default set of tests (may be package dependent)          |
| `test-debug`       | Run unit/integration tests with inspect node CLI flags           |
| `test-unit`        | Run unit tests                                                   |
| `test-integration` | Run integration tests                                            |
| `test-e2e`         | Run end-to-end tests                                             |
| `test-system`      | Run system tests                                                 |
| `test-watch`       | Run unit tests and rebuild/rerun on file changes                 |

> Most of the time you will only want to run a task within a specific package; this can be done by providing the package name as a scope to the top level task.

```shell
# Run test-unit only within cypress package (./cli)
$ yarn test-unit --scope cypress

# Run test-unit only within the cypress and server packages (./cli & ./packages/server)
$ yarn test-unit --scope cypress --scope @packages/server

# Run test-unit in all packages with the name starting with `@packages/`
$ yarn test-unit --scope @packages/*
```

##### Package-Level Scripts

> Although scripts are meant to be run from the root of the repo; they typically delegate to the scripts within the packages.

Each package is responsible for building itself and testing itself and can do so using whatever tools are appropriate, but each conforms to a standard set of scripts so that building, watching, testing, etc. can be orchestrated from the root of this repo. Here are the scripts supported and what they mean:

| Task               | Purpose                                                                                                                                                  |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`            | Build the package                                                                                                                                        |
| `build-prod`       | Build all assets for production (if makes sense)                                                                                                         |
| `start`            | Run a server for serving files                                                                                                                           |
| `watch`            | Watch source files and build development assets when they are saved. This may also run a server for serving files and run tests related to a saved file. |
| `clean`            | Remove any assets created by `build-dev` or `build-prod`                                                                                                 |
| `clean-deps`       | Remove any dependencies installed (usually by `yarn`)                                                                                                    |
| `test`             | Runs all tests once (this usually means running unit tests; via `yarn test-unit`)                                                                        |
| `test-unit`        | Run all unit tests within the package; `exit 0` if N/A                                                                                                   |
| `test-integration` | Run all integration tests within the package; `exit 0` if N/A                                                                                            |
| `test-watch`       | Run all unit tests in the package in watch mode                                                                                                          |

#### Internal Vite Options
When executing top or package level scripts, [Vite](https://vitejs.dev/) may be used to build/host parts of the application. This section is to serve as a general reference for these environment variables that may be leverage throughout the repository.
###### `CYPRESS_INTERNAL_VITE_DEV`
Set to `1` if wanting to leverage [vite's](https://vitejs.dev/guide/#command-line-interface) `vite dev` over `vite build` to avoid a full [production build](https://vitejs.dev/guide/build.html).
###### `CYPRESS_INTERNAL_VITE_INSPECT`
Used internally to leverage [vite-plugin-inspect](https://github.com/antfu/vite-plugin-inspect) to view intermediary vite plugin state. The `CYPRESS_INTERNAL_VITE_DEV` is required for this to be applied correctly. Set to `1` to enable.
###### `CYPRESS_INTERNAL_VITE_OPEN_MODE_TESTING`
Leveraged only for internal cy-in-cy type tests to access the Cypress instance from the parent frame. Please see the [E2E Open Mode Testing](./guides/e2e-open-testing.md) Guide. Set to `true` when doing
###### `CYPRESS_INTERNAL_VITE_APP_PORT`
Leveraged only when `CYPRESS_INTERNAL_VITE_DEV` is set to spawn the vite dev server for the app on the specified port. The default port is `3333`.
###### `CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT`
Leveraged only when `CYPRESS_INTERNAL_VITE_DEV` is set to spawn the vite dev server for the launchpad on the specified port. The default port is `3001`.
#### Debug Logs

Many Cypress packages print out debugging information to console via the `debug` module. See ["Debug logs"](./guides/debug-logs.md) for more information.

### Coding Style

We use [eslint](https://eslint.org/) to lint all JavaScript code and follow rules specified in
[@cypress/eslint-plugin-dev](./npm/eslint-plugin-cypress) plugin.

This project uses a Git pre-commit hook to lint staged files before committing. See the [`lint-staged` project](https://github.com/okonet/lint-staged) for details.
`lint-staged` will try to auto-fix any lint errors with `eslint --fix`, so if it fails, you must manually fix the lint errors before committing.

We **DO NOT** use Prettier to format code. You can find [.prettierignore](.prettierignore) file that ignores all files in this repository. To ensure this file is loaded, please always open _the root repository folder_ in your text editor, otherwise your code formatter might execute, reformatting lots of source files.

### Adding links within code

When adding links to outside resources within the Cypress Test Runner (including links to Cypress's own documentation), we utilize our [`cypress-on`](https://github.com/cypress-io/cypress-services/tree/develop/packages/on) service for all links.

This is to ensure that links do not go dead in older versions of Cypress when the location of the link has changed. To add a new link:

- Make up a new slug for the linked resource like `https://on.cypress.io/my-special-link`.
- Open a PR adding the new slug in [links.yml](https://github.com/cypress-io/cypress-services/blob/develop/packages/on/data/links.yml) with the href of the resource it should redirect to. *Note: this requires access to the internal [cypress-services](https://github.com/cypress-io/cypress-services) repo which is only granted to Cypress employees. If you're an outside contributor and need a link reroute added, please comment in the relevant PR asking for assistance.*
- Wait for the PR to be reviewed and **deployed** from [cypress-services](https://github.com/cypress-io/cypress-services). This is required before your changes can be merged into the `cypress` project.

### Tests

For most packages there are typically unit and integration tests. For UI packages there are E2E and component tests.

Please refer to each packages' `README.md` which documents how to run tests. It is not feasible to try to run all of the tests together. We run our entire test fleet across over a dozen containers in CI.

There are also a set of system tests in [`system-tests`](system-tests) which attempt to test the entire Cypress App as close to real world as possible. See  the [`README`](system-tests/README.md) for more information.

Additionally, we test the code by running it against various other example projects in CI. See CI badges and links at the top of this document.

If you're curious how we manage all of these tests in CI check out our [CircleCI config](.circleci/config.yml).

Some of our test jobs in CircleCI require access to environment variables that are sensitive and are restricted to Cypress maintainers only. If you are not a Cypress maintainer, when your CI job runs, only a subset of jobs will run at first. A Cypress maintainer will need to approve the `contributor-pr` job in your workflow in order for your CI pipeline to complete.

#### Docker

Sometimes tests pass locally, but fail in CI. Our CI environment is dockerized. In order to run the image used in CI locally:

1. [Install Docker](https://docs.docker.com/install/) and get it running on your machine.
2. Run the following command from the root of the project:

```shell
$ yarn docker
```

There is a script [scripts/run-docker-local.sh](scripts/run-docker-local.sh) that runs the cypress image (see [CircleCI config](.circleci/config.yml) for the current image name).

The image will start and will map the root of the repository to `/cypress` inside the image. Now you can modify the files using your favorite environment and rerun tests inside the docker environment.

#### Docker for built binary

You can also use Docker to simulate and debug the built binary. In a temporary folder (for example from the folder `/tmp/test-folder/`) start a Docker image:

```shell
$ docker run -it -w /app -v $PWD:/app cypress/base:8 /bin/bash
```

Point the installation at a specific beta binary and NPM package archive (if needed) and _set local cache folder_ to unzip the downloaded binary into a subfolder.

```shell
$ export CYPRESS_INSTALL_BINARY=https://cdn.cypress.io/beta/.../cypress.zip
$ export CYPRESS_CACHE_FOLDER=./cypress-cache
$ yarn add https://cdn.cypress.io/beta/npm/.../cypress.tgz
```

Note that unzipping the Linux binary inside a Docker container onto a mapped volume drive is *slow*. But once this is done you can modify the application resource folder in the local folder `/tmp/test-folder/node_modules/cypress/cypress-cache/3.3.0/Cypress/resources/app` to debug issues.

#### Docker as a performance constrained environment

Sometimes performance issues are easier to reproduce in performance constrained environments. A docker container can be a good way to simulate this locally and allow for quick iteration.

In a fresh cypress repository run the following command:

```shell
docker compose run --service-port dev
```

This will spin up a docker container based off cypress/browsers:latest and start up the bash terminal. From here you can yarn install and develop as normal, although slower. It's recommend that you run this in a fresh repo because node modules may differ between an install on your local device and from within a linux docker image.

Ports 5566 and 5567 are available to attach debuggers to, please note that docker compose run only maps ports if the `--service-port` command is used.

### Packages

Generally when making contributions, you are typically making them to a small number of packages. Most of your local development work will be inside a single package at a time.

Each package documents how to best work with it, so consult the `README.md` of each package.

They will outline development and test procedures. When in doubt just look at the `scripts` of each `package.json` file. Everything we do at Cypress is contained there.

## Committing Code

### Branches

The repository has one protected branch:

- `develop` contains the current latest "pre-release" code for the Cypress app and contains the already published code of all [standalone npm packages](./npm) Cypress maintains. This branch is set as the default branch, and all pull requests should be made against this branch.

We want to publish our [standalone npm packages](./npm) continuously as new features are added. Therefore, after any pull request that changes independent `@cypress/` packages in the [`npm`](./npm) directory will automatically publish when a PR is merged directly into `develop` and the entire build passes. We used [`semantic-release`](https://semantic-release.gitbook.io/semantic-release/) to automate the release of these packages to npm.

We do not continuously deploy the Cypress binary, so `develop` contains all of the new features and fixes that are staged to go out in the next update of the main Cypress app. If you make changes to an npm package that can't be published until the binary is also updated, the pull request should clearly state that it should not be merged until the next scheduled Cypress app release date.

### Pull Requests

- Break down pull requests into the smallest necessary parts to address the original issue or feature. This helps you get a timely review and helps the reviewer clearly understand which pieces of the code changes are relevant.
- When opening a PR for a specific issue already open, please name the branch you are working on using the convention `issue-[issue number]`. For example, if your PR fixes Issue #803, name your branch `issue-803`. If the PR is a larger issue, you can add more context like `issue-803-new-scrollable-area`. If there's not an associated open issue, **[create an issue](https://github.com/cypress-io/cypress/issues/new/choose)**.
- PRs can be opened before all the work is finished. In fact we encourage this! Please create a [Draft Pull Request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests#draft-pull-requests) if your PR is not ready for review. [Mark the PR as **Ready for Review**](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/changing-the-stage-of-a-pull-request#marking-a-pull-request-as-ready-for-review) when you're ready for a Cypress team member to review the PR.
- Prefix the title of the Pull Request using [semantic-release](https://github.com/semantic-release/semantic-release)'s format using one of the following definitions. Once committed to develop, this prefix will determine the appropriate 'next version' of Cypress or the corresponding npm module.
  - Changes has user-facing impact:
    - `breaking` - A breaking change that will require a MVB
    - `dependency` - A change to a dependency that impact the user
    - `deprecation` - An API deprecation notice for users
    - `feat` - A new feature
    - `fix` - A bug fix or regression fix.
    - `misc` - a misc user-facing change, like a UI update which is not a fix or enhancement to how Cypress works
    - `perf` - A code change that improves performance
  - Changes that improves the codebase or system but has no user-facing impact:
    - `chore` - Changes to the build process or auxiliary tools and libraries such as documentation generation
    - `docs` -  Documentation only changes
    - `refactor` - A code change that neither fixes a bug nor adds a feature
    - `revert` - Reverts a previous commit
    - `test` - Adding missing or correcting existing tests
- For user-facing changes that will be released with the next Cypress version, be sure to add a changelog entry to the appropriate section in [`cli/CHANGELOG.md`](./cli/CHANGELOG.md). See [Writing the Cypress Changelog Guide](./guides/writing-the-cypress-changelog.md) for more details.
- Fill out the [Pull Request Template](./.github/PULL_REQUEST_TEMPLATE.md) completely within the body of the PR. If you feel some areas are not relevant add `N/A` as opposed to deleting those sections. PRs will not be reviewed if this template is not filled in.
- Please check the "Allow edits from maintainers" checkbox when submitting your PR. This will make it easier for the maintainers to make minor adjustments, to help with tests or any other changes we may need.
![Allow edits from maintainers checkbox](https://user-images.githubusercontent.com/1271181/31393427-b3105d44-ada9-11e7-80f2-0dac51e3919e.png)
- All Pull Requests require a minimum of **two** approvals.
- After the PR is approved, the original contributor can merge the PR (if the original contributor has access).
- When you merge a PR into `develop`, select [**Squash and merge**](https://docs.github.com/en/github/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges#squash-and-merge-your-pull-request-commits). This will squash all commits into a single commit.

*The only exceptions to squashing are:*

1. When converting files to another language and there is a clear commit history needed to maintain from the file conversion.
2. When merging a `release/*` branch to `develop`. Individual PRs were already squashed when they were merged to the release branch, and we want that history intact on develop.

### Write Some Tests

If you are adding a new feature or fixing a regression, ensure you add tests for it. Broadly speaking, there are four categories of tests you might consider:

1. Unit tests. Those are inside of `test/unit`, if the package has them. These are the fastest and cheapest to execute.
2. Component Tests. These are co-located with components in the `src` directory of UI-related packages. These test individual UI components in isolation. They can exhaustively test all expected variations of a component and are faster than E2E tests.
3. E2E/Integration tests. Those are inside `cypress/e2e`, if the package has them. These are between Unit Tests and System Tests when it comes to speed of execution.
4. System tests. Those go in the [`system-tests`](https://github.com/cypress-io/cypress/tree/develop/system-tests) directory. The README explains how they work. These are the slowest to run, so you generally only want to add a system-test if it's absolutely required (but don't let that discourage you; they are also the most realistic way to test Cypress).

When choosing what's most appropriate, consider:

- ease of understanding
- ease of debugging
- resilience to refactoring

It is also worth considering when a failure will be noticed. A unit or component test is likely to be run while the related code is being modified and provides very fast feedback. E2E tests and System Tests are more likely to only fail in CI since they are slower to run.

### Dependencies

We use [RenovateBot](https://renovatebot.com/) to automatically upgrade our dependencies. The bot uses the settings in [renovate.json](renovate.json) to maintain our [Update Dependencies](https://github.com/cypress-io/cypress/issues/3777) issue and open PRs. You can manually select a package to open a PR from our [Update Dependencies](https://github.com/cypress-io/cypress/issues/3777) issue.

After a PR has been opened for a dependency update, our `cypress-bot` will comment on the PR detailing the guidelines to be used to review the dependency update. Please read these guidelines carefully and make any updates where you see the PR may not be meeting the quality of these guidelines.

## Reviewing Code

### Some rules about Code Review

1. The contributor opening the pull request may not approve their own PR.
2. The PR will not be merged if some reviewers have requested changes.

If any of the Pull Request Review guidelines can't be met, a comment should be left by the reviewer with 'Request changes'. The original contributor is responsible for making any updates and request re-review once those changes are addressed.

### Steps to take during Code Review

- Run the code and use it as the end user would.
- Double check the issue and PR description to ensure it is meeting the original requirements.
- Read through every line of changed code (Yes, we know this could be a LOT).
- If you don't understand why some piece of code is required, ask for clarification! Likely the contributor had a reason and can provide the answer quicker than investigating yourself.

### Code Review Checklist

Below are guidelines to help during code review. If any of the following requirements can't be met, leave a comment in the review selecting 'Request changes', otherwise 'Approve'.

#### User Experience

- [ ] The feature/bugfix is self-documenting from within the product.
- [ ] The change provides the end user with a way to fix their problem (no dead ends).
- [ ] If a breaking change or a change to a commonly used API, the proposed changes have been discussed and agreed upon in the weekly team meeting (or a separate meeting if a larger change).

#### Functionality

- [ ] The code works and performs its intended function with the correct logic.
- [ ] Performance has been factored in (for example, the code cleans up after itself to not cause memory leaks).
- [ ] The code guards against edge cases and invalid input and has tests to cover it.

#### Maintainability

- [ ] The code is readable (too many nested 'if's are a bad sign).
- [ ] Names used for variables, methods, etc, clearly describe their function.
- [ ] The code is easy to understand and there are relevant comments explaining.
- [ ] New algorithms are documented in the code with link(s) to external docs (flowcharts, w3c, chrome, firefox).
- [ ] There are comments containing link(s) to the addressed issue (in tests and code).

#### Quality

- [ ] The change does not reimplement code.
- [ ] There's not a module from the ecosystem that should be used instead.
- [ ] There is no redundant or duplicate code.
- [ ] There are no irrelevant comments left in the code.
- [ ] There is no irrelevant code to the issue being addressed. If there is, ask the contributor to break the work out into a separate PR.
- [ ] Tests are testing the code's intended functionality in the best way possible.

### Code Review of Dependency Updates

Below are some guidelines Cypress uses when reviewing dependency updates.

#### Dependency Update Instructions

- Read through the entire changelog of the dependency's changes. If a changelog is not available, check every commit made to the dependency. **NOTE** - do not rely on semver to indicate breaking changes - every product does not follow this standard.
- Add a PR review comment noting any relevant changes in the dependency.
- If any of the following requirements cannot be met, leave a comment in the review selecting 'Request changes', otherwise 'Approve'.

#### Dependency Updates Checklist

- [ ] Code using the dependency has been updated to accommodate any breaking changes
- [ ] The dependency still supports the version of Node that the package requires.
- [ ] Appropriate labels have been added to the PR (for example: label `type: breaking change` if it is a breaking change)

## Releases

[Standalone npm packages](./npm) are deployed immediately when a PR is merged into `develop` and the entire build passes.

The Cypress app is typically released every two weeks. All PRs merged to `develop` will build a "pre-released" Cypress app which can be installed to verify or leverage your changes before the scheduled release. Read these instructions for [installing pre-release versions](https://docs.cypress.io/guides/references/advanced-installation#Install-pre-release-version).

If you want to know our build process or build your own Cypress binary, read [the "Release Process" guide](./guides/release-process.md).

## Known problems

### ENFILE or EMFILE

If you get `ENFILE: file table overflow`, `ENFILE: too many open files` or any other `ENFILE` or `EMFILE` errors on Mac, that means you are doing synchronous file system operations. Cypress should **NEVER** do them. Instead we should use async file system operations and let `graceful-fs` retry them. Find the place where the synchronous `fs` operation is done from the stacktrace and make it async.

### lock file

You can rebuild the lock file using the latest `develop` version in a clean isolated environment using Docker. From the current branch:

```shell
git checkout develop
git pull
git checkout -
git checkout origin/develop -- yarn.lock
# remove all unknown files
git clean -xfd
yarn
```
