# Desktop GUI

The Desktop GUI is the react application that is rendered by Electron. This acts as the visual user interface you see when running: `cypress open`.

The Desktop GUI has the following responsibilities:

- Allowing users to login through GitHub.
- Allowing users to add projects to be tested in Cypress.
- Displaying existing projects and allowing the removal of projects.
- Initializing the server to run on a specific project.
- Allowing users to choose a specific browser to run tests within.
- Displaying the resolved configuration of a running project.
- Displaying the list of tests of a running project.
- Initializing the run of a specific test file or all tests chosen by the user.
- Notifying users of updates to Cypress and initializing update process.

## Install

The Desktop GUI's dependencies can be installed with:

```bash
cd packages/desktop-gui
npm install
```

## Developing

**NOTE:** Currently, if you want to work on the code around **logging in**, **viewing runs**, or **setting up new projects to record**, this requires connecting to a locally running API server.

Our API server is only accessible to Cypress employees at the moment. If you want to work with the code, we recommend working within the Cypress tests for the Desktop-Gui. There are lots of tests mocking our API server around logging in, seeing runs, and setting up projects.

### Watching

This watches and compiles all changes as you make them.

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into `dist`
- Compiles `*.scss` files into `dist`

```bash
## from 'cypress/packages/desktop-gui' dir
npm run watch
```

### One Time Build

#### For development

```bash
## from 'cypress/packages/desktop-gui' dir
npm run build
```

#### For production

```bash
## from 'cypress/packages/desktop-gui' dir
npm run build-prod
```

## Testing

This project is tested with Cypress itself. It acts exactly like any other Cypress project.

```bash
## from 'cypress/packages/desktop-gui' dir
npm run cypress:open
```

From here, you can drag in the `desktop-gui` dir from your local fork of `cypress`. Click into the project and run the tests~

### Running


You can also run all of the Desktop GUI's tests locally. We don't really recommend this because it takes a long time, and we have this process optimized by load balancing the tests across multiple workers in CI.

It's usually easier to run the tests in the GUI, commit, and then see if anything broke elsewhere.

```bash
## run all the tests 
## from 'cypress/packages/desktop-gui' dir
npm run cypress:run
```
