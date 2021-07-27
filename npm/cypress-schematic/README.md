# Cypress Angular Schematic

> 🔖  **Official Angular Schematic and Builder for the Angular CLI.** <br/>
> This project is maintained by the Cypress Team.

<p align="center">
  <a href="https://cypress.io">
    <img width="140" alt="Cypress Logo" src="https://raw.githubusercontent.com/cypress-io/cypress/develop/npm/cypress-schematic/src/svgs/built-by-cypress.svg" />
    </a>
</p>

 Add this schematic to quickly get up and running with [Cypress](https://cypress.io) in your Angular project.

 ___

 ## What does this schematic do?

**Once added to your project, it will:**

✅  Install Cypress

✅  Add npm scripts for running Cypress in `run` mode and `open` mode

✅  Scaffold base Cypress files and directories

✅  Provide the ability to add new e2e files easily using `ng-generate`

✅  Optional: prompt you to add or update the default `ng e2e` command to use Cypress.

## Usage ⏯

Install the schematic:

```shell
ng add @cypress/schematic
```
To run Cypress in `open` mode within your project: 

```shell script
ng run {project-name}:cypress-open
```

To run Cypress headlessly via `run` mode within your project:

```shell script
ng run {project-name}:cypress-run
```

If you have chosen to add or update the `ng e2e` command, you can also run Cypress in `open` mode using this:

```shell script
ng e2e
```

To generate new e2e spec files:

```shell script
ng generate @cypress/schematic:e2e
```

## Builder Options 🛠

### Running the builder with a specific browser

Before running Cypress in `open` mode, ensure that you have started your application server using `ng serve`.

```json
"cypress-open": {
  "builder": "@cypress/schematic:cypress",
  "options": {
    "watch": true,
    "headless": false,
    "browser": "chrome"
  },
  "configurations": {
    "production": {
      "devServerTarget": "{project-name}:serve:production"
    }
  }
}
```

Read our docs to learn more about [launching browsers](https://on.cypress.io/launching-browsers) with Cypress.

### Recording test results to the Cypress Dashboard

We recommend setting your [Cypress Dashboard](https://docs.cypress.io/guides/dashboard/introduction) recording key as an environment variable and NOT as a builder option when running it in CI.

```json
"cypress-run": {
  "builder": "@cypress/schematic:cypress",
  "options": {
    "devServerTarget": "{project-name}:serve",
    "record": true,
    "key": "your-cypress-dashboard-recording-key"
  },
  "configurations": {
    "production": {
      "devServerTarget": "{project-name}:production"
    }
  }
}
```

Read our docs to learn more about [recording test results](https://on.cypress.io/recording-project-runs) to the [Cypress Dashboard](https://docs.cypress.io/guides/dashboard/introduction).

### Specifying a custom `cypress.json` config file

It may be useful to have different Cypress configuration files per environment (ie. development, staging, production).

```json
"cypress-run": {
  "builder": "@cypress/schematic:cypress",
  "options": {
    "devServerTarget": "{project-name}:serve",
    "configFile": "cypress.production.json"
  },
  "configurations": {
    "production": {
      "devServerTarget": "{project-name}:production"
    }
  }
}
```

Read our docs to learn more about all the [configuration options](https://on.cypress.io/configuration) Cypress offers.

### Running Cypress in parallel mode within CI

```json
"cypress-run": {
  "builder": "@cypress/schematic:cypress",
  "options": {
    "devServerTarget": "{project-name}:serve",
    "parallel": true,
    "record": true,
    "key": "your-cypress-dashboard-recording-key"
  },
  "configurations": {
    "production": {
      "devServerTarget": "{project-name}:production"
    }
  }
}
```

Read our docs to learn more about speeding up test execution in CI via [Cypress parallelization](https://on.cypress.io/parallelization)

### Specifying a custom reporter and options

You may want to specify a custom reporter. Cypress works with any reporters built for Mocha: built-in, third-party, or custom. In addition to specifying reporters, you can specify reporter options. These differ based on the reporter, and you should refer to its documentation for supported options.

```json
"cypress-run": {
  "builder": "@cypress/schematic:cypress",
  "options": {
    "devServerTarget": "{project-name}:serve",
    "reporter": "junit",
    "reporterOptions": {
      "mochaFile": "results/my-test-output.xml",
      "toConsole": true
    }
  },
  "configurations": {
    "production": {
      "devServerTarget": "{project-name}:production"
    }
  }
}
```

Read our docs to learn more about working with [reporters](https://on.cypress.io/reporters).

## Generator Options

### Specify Filename (bypassing CLI prompt)

In order to bypass the prompt asking for your e2e spec name, simply add a `--name=` flag like this:

```shell script
ng generate @cypress/schematic:e2e --name=login
```

This will create a new spec file named `login.spec.ts` in the default Cypress folder location.


### Specify Project

Add a `--project=` flag to specify the project:

```shell script
ng generate @cypress/schematic:e2e --name=login --project=sandbox
```
### Specify Path

Add a `--path=` flag to specify the project:

```shell script
ng generate @cypress/schematic:e2e --name=login --path=src/app/tests
```

This will create the e2e spec file in your specific location, creating folders as needed.

## Migrating from Protractor to Cypress?

Read our [migration guide](https://on.cypress.io/protractor-to-cypress) to help you make the transition from Protractor to Cypress.

## Questions or Issues?

Visit our [plugins discussion](https://github.com/cypress-io/cypress/discussions/categories/plugins) to ask questions or report issues related to this package.

## License

This project is licensed under an MIT license. 

## Community Recognition

The [Cypress Angular Schematic](https://www.npmjs.com/package/@cypress/schematic) package was made possible by the original work of the [Briebug](https://briebug.com/) team and the contributors of [@briebug/cypress-schematic](https://www.npmjs.com/package/@briebug/cypress-schematic).

@briebug/cypress-schematic served as the starting point for improvements and new functionality the Cypress team will continue to develop along with the community.
