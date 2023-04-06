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

✅  Add npm scripts for running Cypress e2e tests in `run` mode and `open` mode

✅  Scaffold base Cypress files and directories

✅  Provide the ability to add new e2e and component specs easily using `ng-generate`

✅  Optional: prompt you to add or update the default `ng e2e` command to use Cypress for e2e tests.

✅  Optional: prompt you to add a `ng ct` command to use Cypress component testing.

## Requirements

- Angular 14+

## Usage ⏯

### Adding E2E and Component Testing

To install the schematic via prompts:

```shell
ng add @cypress/schematic
```

To install the schematic via cli arguments (installs both e2e and component testing):

```shell
ng add @cypress/schematic --e2e --component
```

The installation will add this schematic to the [default schematic collections](https://angular.io/guide/workspace-config#angular-cli-configuration-options). This allows you to execute the CLI commands without prefixing them with the package name.

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

If you have chosen to add Cypress component testing, you can run component tests in `open` mode using this:

```shell script
ng run {project-name}:ct
```

### Generating New Cypress Spec Files

To generate a new e2e spec file:

```shell script
ng generate spec 
```

or (without cli prompt)

```shell script
ng generate spec {name}
```

To generate a new component spec file:

```shell script
ng generate spec --component
```

or (without cli prompt)

```shell script
ng generate spec {component name} --component
```

To generate a new component spec file in a specific folder:

```shell script
ng generate spec {component name} --component --path {path relative to project root}
```

To generate new component spec files alongside all component files in a project:

```shell script
ng generate specs-ct
```

To generate a new, generic component definition with a component spec file in the given or default project. This wraps the [Angular CLI Component Generator](https://angular.io/cli/generate#component) and supports the same arguments.

```shell script
ng generate component {component name}
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

### Recording test results to Cypress Cloud

We recommend setting your [Cypress Cloud](https://on.cypress.io/features-dashboard) recording key as an environment variable and NOT as a builder option when running it in CI.

```json
"cypress-run": {
  "builder": "@cypress/schematic:cypress",
  "options": {
    "devServerTarget": "{project-name}:serve",
    "record": true,
    "key": "your-cypress-cloud-recording-key"
  },
  "configurations": {
    "production": {
      "devServerTarget": "{project-name}:production"
    }
  }
}
```

Read our docs to learn more about [recording test results](https://on.cypress.io/recording-project-runs) to [Cypress Cloud](https://on.cypress.io/features-dashboard).

### Specifying a custom config file

It may be useful to have different Cypress configuration files per environment (ie. development, staging, production).

```json
"cypress-run": {
  "builder": "@cypress/schematic:cypress",
  "options": {
    "devServerTarget": "{project-name}:serve",
    "configFile": "cypress.production.js"
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
    "key": "your-cypress-cloud-recording-key"
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

### Running the builder with a different baseUrl

You can specify a `baseUrl` that is different than the one in `cypress.config.js`. There are two ways to do this.

1. Add `baseUrl` to `configurations` like the following: 

```json
"cypress-open": {
  "builder": "@cypress/schematic:cypress",
  "options": {
    "devServerTarget": "{project-name}:serve",
    "watch": true,
    "headless": false
  },
  "configurations": {
    "production": {
      "devServerTarget": "{project-name}:serve:production"
    },
    "local-dev": {
      "devServerTarget": "{project-name}:serve:development",
      "baseUrl": "http://localhost:4002"
    },
    "another-env": {
      "devServerTarget": "{project-name}:serve:development",
      "baseUrl": "http://localhost:4004"
    }
  }
}
```

2. Add custom options to `devServerTarget` in `angular.json`:

```json
"options": {
  "host": "localhost",
  "port": 4200
},
```

In order to prevent the application from building, add the following to the end of your command:

```shell
--dev-server-target=''
```

## Generator Options

### Specify Testing Type 

The default generated spec is E2E.  In order to generate a component test you can run:

```shell script
ng generate @cypress/schematic:spec --name=button -t component
```

`-t` is an alias for `testing-type`. It accepts `e2e` or `component` as arguments. If you are using the CLI tool, a prompt will appear asking which spec type you want to generate.

### Specify Filename (bypassing CLI prompt)

In order to bypass the prompt asking for your spec name add a `--name=` flag like this:

```shell script
ng generate @cypress/schematic:spec --name=login
```

This will create a new spec file named `login.cy.ts` in the default Cypress folder location.

### Specify Project

Add a `--project=` flag to specify the project:

```shell script
ng generate @cypress/schematic:spec --name=login --project=sandbox
```
### Specify Path

Add a `--path=` flag to specify the project:

```shell script
ng generate @cypress/schematic:spec --name=login --path=src/app/tests
```

This will create a spec file in your specific location, creating folders as needed. By default, new specs are created in either `cypress/e2e` for E2E specs or `cypress/ct` for component specs.

### Generate Tests for All Components

You can scaffold component test specs alongside all your components in the default project by using:

```shell script
ng generate @cypress/schematic:specs-ct -g
```

This will identify files ending in `component.ts`. It will then create spec files alongside them - if they don't exist.

If you would like to specify a project, you can use the command:

```shell script
ng generate @cypress/schematic:specs-ct -g -p {project-name}
```

## Migrating from Protractor to Cypress?

Read our [migration guide](https://on.cypress.io/protractor-to-cypress) to help you make the transition from Protractor to Cypress.

## Questions or Issues?

Visit our [plugins discussion](https://github.com/cypress-io/cypress/discussions/categories/plugins) to ask questions or report issues related to this package.

## License

This project is licensed under an MIT license. 

## Community Recognition

The [Cypress Angular Schematic](https://www.npmjs.com/package/@cypress/schematic) package was made possible by the original work of the [Briebug](https://briebug.com/) team and the contributors of [@briebug/cypress-schematic](https://www.npmjs.com/package/@briebug/cypress-schematic).

@briebug/cypress-schematic served as the starting point for improvements and new functionality the Cypress team will continue to develop along with the community.
