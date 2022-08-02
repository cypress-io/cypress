# Testing other projects

In `develop`, `master`, and any other branch configured in [`circle.yml`](../circle.yml), the Cypress binary and npm package are built and uploaded to `cdn.cypress.io`. Then, tests are run, using a variety of real-world example repositories.

Two main strategies are used to spawn these test projects:

1. `test-binary-against-repo` jobs
2. Remote CI

## `test-binary-against-repo` jobs

A number of CI jobs in `circle.yml` clone test projects and run tests as part of `cypress-io/cypress`'s CI pipeline.

You can find a list of test projects that do this by searching for usage of the `test-binary-against-repo` step.

Similarly to "Remote CI" test projects, Local CI test projects will attempt to check out a branch that is named after the [next version](./next-version.md) (`X.Y.Z`) if one exists in the test project git repo.

One advantage to local CI is that it does not require creating commits to another repo.

## `binary-system-tests`

System tests in `/system-tests/test-binary` are run against the built Cypress App in CI. For more details, see the [README](../system-tests/README.md).