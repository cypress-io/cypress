# Testing other projects

In `develop`, `master`, and any other branch configured in [`circle.yml`](../circle.yml), the Cypress binary and npm package are built and uploaded to `cdn.cypress.io`. Then, tests are run, using a variety of real-world example repositories.

Two main strategies are used to spawn these test projects:

1. Local CI
2. Remote CI

## Local CI

A number of CI jobs in `circle.yml` clone test projects and run tests as part of `cypress-io/cypress`'s CI pipeline.

You can find a list of test projects that do this by searching for usage of the `test-binary-against-repo` step.

Similarly to "Remote CI" test projects, Local CI test projects will attempt to check out a branch that is named after the [next version](./next-version.md) (`X.Y.Z`) if one exists in the test project git repo.

One advantage to local CI is that it does not require creating commits to another repo.

## Remote CI

After the production binary and NPM package are build and uploaded in CI, [`/scripts/test-other-projects.js`](../scripts/test-other-projects.js) is run as part of the `test-other-projects` `circle.yml` step.

This script creates commits inside of several test projects (hence "Remote CI") in order to trigger a realistic, continous-integration test of Cypress.

For a list of the projects, see the definition of `_PROVIDERS` in [`/scripts/binary/bump.js`](../scripts/binary/bump.js).

For each project and operating system combo in `_PROVIDERS`, the script:

1. Creates a commit to the test project's GitHub repo using the API. [An example of such a commit.](https://github.com/cypress-io/cypress-test-tiny/commit/5b39f3f43f6b7598f0d57cffcba71a7048d1d809)
    * Note the commit is specifically for `linux`, and only the `linux-tests` job runs to completion.
    * If a branch exists that is named after the [next version](./next-version.md) (`X.Y.Z`), the commit will be made to that branch.
        * This is useful to test a release's breaking changes or new features against an example project without having to have the project's main branch in a broken state.
    * Otherwise, the default branch is used for the commit.
2. Creates a status check in this GitHub repo (`cypress-io/cypress`) and marks it `pending`.
3. Waits for the test project's CI workflow to finish running.
    * Each test project is configured to use [`@cypress/commit-message-install`](https://github.com/cypress-io/commit-message-install) to configure the exact test required via the information in the commit message.
    * Each test project is configured to update the `pending` CI job in `cypress-io/cypress` to a `success` when the CI workflow successfully finishes.

These tests add coverage to the Cypress code base by:

* Providing a super-close-to-real-world usage of Cypress (i.e. installing fresh from an NPM package and running in a bare repo using the repo's CI setup)
* Testing in a variety of environments
  * Different Node.js versions
  * Different operating systems
  * A multitude of CI providers