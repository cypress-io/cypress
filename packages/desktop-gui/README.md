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

## Development

### Watching

This watches and compiles all changes as you make them.

- Runs `*.js` and `*.jsx` through babel and bundles with browserify into `dist`
- Compiles `*.scss` files into `dist`

```bash
npm run watch
```

### One Time Build

#### For development

```bash
npm run build
```

#### For production

```bash
npm run build-prod
```

## Testing

This project is tested with Cypress itself. It acts exactly like any other Cypress project.

### Developing

If you're developing on the Desktop GUI, you'll want to run in the normal Cypress GUI mode, like you would when you're writing tests for your own Cypress projects.

```bash
## run in cypress GUI mode
npm run cypress:open
```

### Running

You can also run all of the Desktop GUI's tests locally. We don't really recommend this because it takes a long time, and we have this process optimized by load balancing the tests across multiple workers in CI.

It's usually easier to run the tests in the GUI, commit, and then see if anything broke elsewhere.

```bash
## run all the tests
npm run cypress:run
```
