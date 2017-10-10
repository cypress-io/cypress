# packages/desktop-gui

The desktop GUI is the desktop application installed to the user's OS.

The desktop GUI has the following responsibilities:

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

Root install is preferred (see `CONTRIBUTING.md`), but if you must

* `npm install`
* `npm run build`

## Testing

This project does not have its own tests, but instead is tested by `packages/server`
