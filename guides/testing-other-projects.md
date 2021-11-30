Testing other projects
===

In CI, the Cypress binary and npm package are built and uploaded to `cdn.cypress.io`. Then, [`/scripts/test-other-projects.js`](../scripts/test-other-proejcts.js) is run.

This script creates commits inside of several test projects in order to trigger a realistic, continous-integration test of Cypress.

For a list of the projects, see the definition of `_PROVIDERS` in [`/scripts/binary/bump.js`](../scripts/binary/bump.js).

For each project and operating system combo in `_PROVIDERS`, the script:

1. Creates a commit to that test project's GitHub repo using the API. [An example of such a commit.](https://github.com/cypress-io/cypress-test-tiny/commit/5b39f3f43f6b7598f0d57cffcba71a7048d1d809)
    * Note the commit is specifically for `linux`, and only the `linux-tests` job runs to completion.
2. Creates a status check in this GitHub repo (`cypress-io/cypress`) and marks it `pending`.
3. Waits for that project's CI workflow to finish running.
    * Each test project is configured to use [`@cypress/commit-message-install`](https://github.com/cypress-io/commit-message-install) to configure the exact test required via the information in the commit message.
    * Each test project is configured to update the `pending` CI job in `cypress-io/cypress` to a `success` when the CI workflow successfully finishes.

These tests add coverage to the Cypress code base by:

* Providing a super-close-to-real-world usage of Cypress (i.e. installing fresh from an NPM package and running in a bare repo using the repo's CI setup)
* Testing in a variety of environments
    * Different Node.js versions
    * Different operating systems
    * A multitude of CI providers