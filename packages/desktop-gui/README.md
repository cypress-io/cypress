# Desktop GUI

The Desktop GUI is the react application that is rendered by Electron. This acts as the visual user interface you see when running: `cypress open`.

<img width="912" alt="screen shot 2017-12-07 at 11 13 45 am" src="https://user-images.githubusercontent.com/1271364/33725282-b47ad740-db3f-11e7-9801-7b6004b1a5bf.png">

**The Desktop GUI has the following responsibilities:**

- Allow users to login through GitHub.
- Allow users to add projects to be tested in Cypress.
- Display existing projects and allow the removal of projects.
- Initialize the server to run on a specific project.
- Allow users to choose a specific browser to run tests within.
- Display the resolved configuration of a running project.
- Display the list of specs of a running project.
- Initialize the run of a specific spec file or all tests chosen by the user.
- Notify users of updates to Cypress and initialize update process.
- Set up projects to be recorded.

## Installing

The Desktop GUI's dependencies can be installed with:

```bash
cd packages/desktop-gui
npm install
```

## Building

### For development

```bash
## from 'cypress/packages/desktop-gui' dir
npm run build
```

### For production

```bash
## from 'cypress/packages/desktop-gui' dir
npm run build-prod
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

## Running

You can also run all of the Desktop GUI's tests locally. We don't really recommend this because it takes a long time, and we have this process optimized by load balancing the tests across multiple workers in CI.

It's usually easier to run the tests in the GUI, commit, and then see if anything broke elsewhere.

```bash
## run all the tests 
## from 'cypress/packages/desktop-gui' dir
npm run cypress:run
```

## Testing

### In Cypress

This project is tested with Cypress itself. It acts exactly like any other Cypress project.

```bash
## from 'cypress/packages/desktop-gui' dir
npm run cypress:open
```
