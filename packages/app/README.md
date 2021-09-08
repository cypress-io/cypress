### Getting Started
This package is the frontend for the new unified Cypress App.

<img src="./unified-runner-diagram.png" width="500">

#### Commands
1. To work in the app frontend, start the dev server (`yarn workspace @packages/app dev`)
1. To see the app run against a real project, navigate to any project (e.g. npm/vue and call `cypress open-ct`)
1. When making changes to `server-ct` or `server`, make sure to bounce the cypress open command like usual.
1. When working on the runner, watch for "runner" changes via  its watch task (`yarn workspace @packages/runner-ct watch`)