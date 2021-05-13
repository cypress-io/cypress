# Cypress Angular Schematic

> 🔖  **Official Angular Schematic and Builder for the Angular CLI.** <br/>
> This project is maintained by the Cypress Team.
><br />

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

✅  Optional: prompt you to remove Protractor and reconfigure default `ng e2e` command to use Cypress.

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

If you have chosen to remove Protractor, you can also run Cypress in `open` mode using this command:

```shell script
ng e2e
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

Read our docs to learn more about [launching browsers](http://on.cypress.io/launching-browsers) with Cypress.

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

Read our docs to learn more about [recording test results](http://on.cypress.io/recording-project-runs) to the [Cypress Dashboard](https://docs.cypress.io/guides/dashboard/introduction).

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

Read our docs to learn more about all the [configuration options](http://on.cypress.io/configuration) Cypress offers.

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

Read our docs to learn more about speeding up test execution in CI via [Cypress parallelization](http://on.cypress.io/parallelization)

## License

This project is licensed under an MIT license. 

## Community Recognition

Inspired by [@briebug/cypress-schematic](https://github.com/briebug/cypress-schematic).
