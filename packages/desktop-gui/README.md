# Desktop GUI

The Desktop GUI is the react application that is rendered by Electron. This acts as the visual user interface you see when running: `cypress open`.

<img width="912" alt="Screen Shot 2020-04-21 at 8 26 21 PM" src="https://user-images.githubusercontent.com/1271364/79874602-93111400-840e-11ea-8dcd-9db86f626176.png">

**The Desktop GUI has the following responsibilities:**

- Allow users to log in through the Dashboard Service.
- Allow users to add and remove projects to be tested in Cypress in global mode.
- Initialize the server to run on a specific project.
- Allow users to choose a specific browser to run tests within.
- Display the list of specs of a running project.
- Initialize the run of a specific spec file or all spec files chosen by the user.
- Notify users of updates to Cypress and initialize update process.
- Set up projects to be recorded.
- Display recently recorded runs for the project.
- Display the resolved configuration of a running project.
- Display other project and user settings such as Node.js version, proxy settings, and experiments.

## Building

### For development

```bash
## from repo root
yarn build --scope @packages/desktop-gui
```

### For production

```bash
## from repo root
yarn build-prod --scope @packages/desktop-gui
```

## Developing

**NOTE:** Currently, if you want to work on the code around **logging in**, **viewing runs**, or **setting up new projects to record**, this requires connecting to a locally running API server.

Our API server is only accessible to Cypress employees at the moment. If you want to work with the code, we recommend working within the Cypress tests for the Desktop-Gui. There are lots of tests mocking our API server around logging in, seeing runs, and setting up projects.

### Watching

This watches and compiles all changes as you make them.

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into `dist`
- Compiles `*.scss` files into `dist`

```bash
## from repo root
yarn watch --scope @packages/desktop-gui
```

## Running

You can also run all of the Desktop GUI's tests locally. We don't really recommend this because it takes a long time, and we have this process optimized by load balancing the tests across multiple workers in CI.

It's usually easier to run the tests in the GUI, commit, and then see if anything broke elsewhere.

```bash
## from repo root
yarn workspace @packages/desktop-gui cypress:run
```

## Testing

### In Cypress

This project is tested with Cypress itself. It acts exactly like any other Cypress project.

```bash
## from repo root
yarn workspace @packages/desktop-gui cypress:open
```

### Component testing

Using [cypress-react-unit-test](https://github.com/bahmutov/cypress-react-unit-test) you can run some of the component tests in this project. You MUST run from the root of the repo using absolute path, no need to start the server.

```bash
yarn dev --project ~/git/cypress/packages/desktop-gui/
```
