# Deployment

These deployment procedures mainly concern the Cypress binary and `cypress` npm module.

Independent `@cypress/` packages that live inside the [`npm`](./npm) directory are automatically published to npm (with [`semantic-release`](https://semantic-release.gitbook.io/semantic-release/)) upon being merged into master. You can read more about this in [CONTRIBUTING.md](./CONTRIBUTING.md#committing-code)

Anyone can build the binary and npm package, but you can only deploy the Cypress application and publish the npm module `cypress` if you are a member of the `cypress` npm organization.

> :information_source: See the [publishing](#publishing) section for how to build, test and publish a
new official version of the binary and `cypress` npm package.

## Building Locally

### Building the npm package

> :warning: Note: The steps in this section are automated in CI, and you should not need to do them yourself when publishing.

Building a new npm package is very quick.

- Increment the version in the root `package.json`
- `yarn build --scope cypress`

The steps above:

- Build the `cypress` npm package
- Transpile the code into ES5 to be compatible with the common Node versions
- Put the result into the [`cli/build`](./cli/build) folder.

### Building the binary

> :warning: Note: The steps in this section are automated in CI, and you should not need to do them yourself when publishing.

The npm package requires a corresponding binary of the same version. In production, it will try to retrieve the binary from the Cypress CDN if it is not cached locally.

You can build the Cypress binary locally by running `yarn binary-build`. You can use Docker to build a Linux binary by running `yarn binary-build-linux`.

`yarn binary-zip` can be used to zip the built binary together.

## Publishing

### Prerequisites

- Ensure you have the following permissions set up:
    - An AWS account with permission to create AWS access keys for the Cypress CDN.
    - Permissions for your npm account to publish the `cypress` package.
    - Permissions to modify environment variables for `cypress` on CircleCI and AppVeyor.
    - Permissions to update releases in ZenHub.

- Set up the following environment variables:
    - Cypress AWS access key and secret in `aws_credentials_json`, which looks like this:
        ```text
        aws_credentials_json={"bucket":"cdn.cypress.io","folder":"desktop","key":"...","secret":"..."}
        ```
    - A [GitHub token](https://github.com/settings/tokens), a [CircleCI token](https://circleci.com/account/api),
      and a `cypress-io` account-specific [AppVeyor token](https://ci.appveyor.com/api-keys) in `ci_json`:
        ```text
        ci_json={"githubToken":"...","circleToken":"...","appVeyorToken":"..."}
        ```
    - You'll also need to put the GitHub token under its own variable and get a [ZenHub API token](https://app.zenhub.com/dashboard/tokens) for the `release-automations` step.
        ```text
        GITHUB_TOKEN="..."
        ZENHUB_API_TOKEN="..."
        ```
    - The `cypress-bot` GitHub app credentials are also needed. Ask another team member who has done a deploy for those.
    - Tip: Use [as-a](https://github.com/bahmutov/as-a) to manage environment variables for different situations.

### Before Publishing a New Version

In order to publish a new `cypress` package to the npm registry, we must build and test it across multiple platforms and test projects. This makes publishing *directly* into the npm registry impossible. Instead, we have CI set up to do the following on every commit to `develop`:

1. Build the npm package with the new target version baked in.
2. Build the Linux/Mac binaries on CircleCI and build Windows on AppVeyor.
3. Upload the binaries and the new npm package to `cdn.cypress.io` under the "beta" folder.
4. Launch the test projects like [cypress-test-node-versions](https://github.com/cypress-io/cypress-test-node-versions) and [cypress-test-example-repos](https://github.com/cypress-io/cypress-test-example-repos) using the newly-uploaded package & binary instead of installing from the npm registry. That installation looks like this:
    ```shell
    export CYPRESS_INSTALL_BINARY=https://cdn.../binary/<new version>/<commit hash>/cypress.zip
    npm i https://cdn.../npm/<new version>/<commit hash>/cypress.tgz
    ```

Multiple test projects are launched for each target operating system and the results are reported
back to GitHub using status checks so that you can see if a change has broken real-world usage
of Cypress. You can see the progress of the test projects by opening the status checks on GitHub:

![Screenshot of status checks](https://i.imgur.com/AsQwzgO.png)

Once the `develop` branch for all test projects are reliably passing with the new changes, publishing can proceed.

### Steps to Publish a New Version

In the following instructions, "X.Y.Z" is used to denote the version of Cypress being published.

1. `develop` should contain all of the changes made in `master`. However, this occasionally may not be the case. Ensure that `master` does not have any additional commits that are not on `develop` and all auto-generated pull requests designed to merge master into develop have been successfully merged.

2. If there is a new [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink/releases) version, update the corresponding dependency in [`packages/example`](./packages/example) to that new version.

3. Use the `move-binaries` script to move the binaries for `<commit sha>` from `beta` to the `desktop` folder for `<new target version>`
    ```shell
    yarn move-binaries --sha <commit sha> --version <new target version>
    ```

4. Publish the new npm package under the `dev` tag, using your personal npm account.
    - To find the link to the package file `cypress.tgz`:
        1. In GitHub, go to the latest commit (the one whose sha you used in the last step).
            ![commit-link](https://user-images.githubusercontent.com/1157043/80608728-33fe6100-8a05-11ea-8b53-375303757b67.png)
        2. Scroll down past the changes to the comments. The first comment should be a `cypress-bot` comment that includes a line beginning `npm install ...`. Grab the `https://cdn.../npm/X.Y.Z/<long sha>/cypress.tgz` link.
            ![cdn-tgz-link](https://user-images.githubusercontent.com/1157043/80608736-3791e800-8a05-11ea-8d75-e4f80128e857.png)
    - Publish to the npm registry straight from the URL:
        ```shell
        npm publish https://cdn.../npm/X.Y.Z/<long sha>/cypress.tgz --tag dev
        ```

5. Double-check that the new version has been published under the `dev` tag using `npm info cypress` or [available-versions](https://github.com/bahmutov/available-versions). `latest` should still point to the previous version. Example output:
    ```shell
    dist-tags:
    dev: 3.4.0     latest: 3.3.2
    ```

6. Test `cypress@X.Y.Z` to make sure everything is working.
    - Install the new version: `npm install -g cypress@X.Y.Z`
    - Run a quick, manual smoke test:
        - `cypress open`
        - Go into a project, run a quick test, make sure things look right
    - Optionally, do more thorough tests:
        - Trigger test projects from the command line (if you have the appropriate permissions)
        ```
        node scripts/test-other-projects.js --npm cypress@X.Y.Z --binary X.Y.Z
        ```
        - Test the new version of Cypress against the Cypress dashboard repo.

7. Deploy the release-specific documentation and changelog in [cypress-documentation](https://github.com/cypress-io/cypress-documentation).
    - If there is not already a release-specific PR open, create one. You can use [`release-automations`](https://github.com/cypress-io/release-automations)'s `issues-in-release` tool to generate a starting point for the changelog, based off of ZenHub:
        ```
        cd packages/issues-in-release
        yarn do:changelog --release <release label>
        ```
    - Ensure the changelog is up-to-date and has the correct date.
    - Merge any release-specific documentation changes into the main release PR.
    - Merging this PR into `develop` will deploy to `docs-staging` and then a PR will be automatically created against `master`. It will be automatically merged after it passes and will deploy to production.

8. Make the new npm version the "latest" version by updating the dist-tag `latest` to point to the new version:
    ```shell
    npm dist-tag add cypress@X.Y.Z
    ```

9. Run `binary-release` to update the [download server's manifest](https://download.cypress.io/desktop.json) and set the next CI version:
    ```shell
    yarn run binary-release --version X.Y.Z
    ```
    > Note: Currently, there is an [issue setting the next CI version](https://github.com/cypress-io/cypress/issues/7176) that will cause this command to fail after setting the download manifest. You will need to manually update NEXT_DEV_VERSION by logging in to CircleCI and AppVeyor. This is noted in Step 16 below.

10. If needed, push out any updated changes to the links manifest to [`on.cypress.io`](https://github.com/cypress-io/cypress-services/tree/develop/packages/on).

11. If needed, deploy the updated [`cypress-example-kitchensink`][cypress-example-kitchensink] to `example.cypress.io` by following [these instructions under "Deployment"](./packages/example/README.md).

12. Update the releases in [ZenHub](https://app.zenhub.com/workspaces/test-runner-5c3ea3baeb1e75374f7b0708/reports/release):
    - Close the current release in ZenHub.
    - Create a new patch release (and a new minor release, if this is a minor release) in ZenHub, and schedule them both to be completed 2 weeks from the current date.
    - Move all issues that are still open from the current release to the appropriate future release.

13. Bump `version` in [`package.json`](package.json), commit it to `develop`, tag it with the version, and push the tag up:
    ```shell
    git commit -am "release X.Y.Z [skip ci]"
    git log --pretty=oneline
    # copy sha of the previous commit
    git tag -a vX.Y.Z <sha>
    git push origin vX.Y.Z
    ```
14. Merge `develop` into `master` and push both branches up. Note: pushing to `master` will automatically publish any independent npm packages that have not yet been published.
    ```shell
    git push origin develop
    git checkout master
    git merge develop
    git push origin master
    ```

15. Inside of [cypress-io/release-automations][release-automations]:
    - Publish GitHub release to [cypress-io/cypress/releases](https://github.com/cypress-io/cypress/releases) using package `set-releases`:
        ```shell
        cd packages/set-releases && npm run release-log -- --version X.Y.Z
        ```
    - Add a comment to each GH issue that has been resolved with the new published version using package `issues-in-release`:
        ```shell
        cd packages/issues-in-release && npm run do:comment -- --release X.Y.Z
        ```

16. Publish a new docker image in [`cypress-docker-images`](https://github.com/cypress-io/cypress-docker-images) under `included` for the new cypress version.

17. Decide on the next version that we will work on. For example, if we have just released `3.7.0` we probably will work on `3.7.1` next. Set it on [CI machines](#set-next-version-on-cis).

18. Update example projects to the new version. For most projects, you can go to the Renovate dependency issue and check the box next to `Update dependency cypress to X.Y.Z`. It will automatically create a PR. Once it passes, you can merge it. Try updating at least the following projects:
    - [cypress-example-todomvc](https://github.com/cypress-io/cypress-example-todomvc/issues/99)
    - [cypress-example-todomvc-redux](https://github.com/cypress-io/cypress-example-todomvc-redux/issues/1)
    - [cypress-example-realworld](https://github.com/cypress-io/cypress-example-realworld/issues/2)
    - [cypress-example-recipes](https://github.com/cypress-io/cypress-example-recipes/issues/225)
    - [cypress-example-api-testing](https://github.com/cypress-io/cypress-example-api-testing/issues/15)
    - [angular-pizza-creator](https://github.com/cypress-io/angular-pizza-creator/issues/5)
    - [cypress-fiddle](https://github.com/cypress-io/cypress-fiddle/issues/5)
    - [cypress-example-piechopper](https://github.com/cypress-io/cypress-example-piechopper/issues/75)
    - [cypress-documentation](https://github.com/cypress-io/cypress-documentation/issues/1313)
    - [cypress-example-docker-compose](https://github.com/cypress-io/cypress-example-docker-compose) - Doesn't have a Renovate issue, but will auto-create and auto-merge non-major Cypress updates as long as the tests pass.

19. Check if any test or example repositories have a branch for testing the features or fixes from the newly published version `x.y.z`. The branch should also be named `x.y.z`. Check all `cypress-test-*` and `cypress-example-*` repositories, and if there is a branch named `x.y.z`, merge it into `master`.

    **Test Repos**

    - [cypress-test-tiny](https://github.com/cypress-io/cypress-test-tiny)
    - [cypress-test-nested-projects](https://github.com/cypress-io/cypress-test-nested-projects)
    - [cypress-test-example-repos](https://github.com/cypress-io/cypress-test-example-repos)
    - [cypress-test-node-versions](https://github.com/cypress-io/cypress-test-node-versions)
    - [cypress-test-module-api](https://github.com/cypress-io/cypress-test-module-api)
    - [cypress-test-ci-environments](https://github.com/cypress-io/cypress-test-ci-environments)

    **Example Repos**

    - [cypress-example-todomvc](https://github.com/cypress-io/cypress-example-todomvc)
    - [cypress-example-todomvc-redux](https://github.com/cypress-io/cypress-example-todomvc-redux)
    - [cypress-example-realworld](https://github.com/cypress-io/cypress-example-realworld)
    - [cypress-example-recipes](https://github.com/cypress-io/cypress-example-recipes)
    - [cypress-example-docker-compose](https://github.com/cypress-io/cypress-example-docker-compose)
    - [cypress-example-api-testing](https://github.com/cypress-io/cypress-example-api-testing)
    - [cypress-example-piechopper](https://github.com/cypress-io/cypress-example-piechopper)
    - [cypress-documentation](https://github.com/cypress-io/cypress-documentation)

Take a break, you deserve it! :sunglasses:

[release-automations]: https://github.com/cypress-io/release-automations
[cypress-example-kitchensink]: https://github.com/cypress-io/cypress-example-kitchensink
