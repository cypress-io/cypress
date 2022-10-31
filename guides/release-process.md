# Release Process

These procedures concern the release process for the Cypress binary and `cypress` npm module.

The `@cypress/`-namespaced NPM packages that live inside the [`/npm`](../npm) directory are automatically published to npm (with [`semantic-release`](https://semantic-release.gitbook.io/semantic-release/)) upon being merged into `develop`. You can read more about this in [CONTRIBUTING.md](../CONTRIBUTING.md#releases).

[Anyone can build the binary and npm package locally](./building-release-artifacts.md), but you can only deploy the Cypress application and publish the npm module `cypress` if you are a member of the `cypress` npm organization.

## Publishing

### Prerequisites

- Ensure you have the following permissions set up:
  - An AWS account with permission to access and write to the AWS S3, i.e. the Cypress CDN.
  - Permissions for your npm account to publish the `cypress` package.
  - Permissions to update releases in ZenHub.

- [Set up](https://cypress-io.atlassian.net/wiki/spaces/INFRA/pages/1534853121/AWS+SSO+Cypress) an AWS SSO profile with the [Team-CypressApp-Prod](https://cypress-io.atlassian.net/wiki/spaces/INFRA/pages/1534853121/AWS+SSO+Cypress#Team-CypressApp-Prod) role. The release scripts assumes the name of your profile is `prod`. Make sure to open the "App Developer" expando for some necessary config values. Your AWS config file should end up looking like the following:

    ```
    [prod]
    sso_start_url = <start_url>
    sso_region = <region>
    aws_access_key_id = <access_key_id>
    aws_secret_access_key = <secret_access_key>
    aws_session_token = <session_token>
    ```

- Set up the following environment variables:
  - For the `release-automations` steps, you will need setup the following envs:
    - GitHub token - generated yourself in github.
    - [ZenHub API token](https://app.zenhub.com/dashboard/tokens) to interact with Zenhub. Found in 1Password.
    - The `cypress-bot` GitHub app credentials. Found in 1Password.
    ```text
    GITHUB_TOKEN="..."
    ZENHUB_API_TOKEN="..."
    GITHUB_APP_CYPRESS_INSTALLATION_ID=
    GITHUB_APP_ID=
    GITHUB_PRIVATE_KEY=
    ```

  - For purging the Cloudflare cache (part of the `move-binaries` step), you'll need `CF_ZONEID` and `CF_TOKEN` set. These can be found in 1Password.
      ```text
      CF_ZONEID="..."
      CF_TOKEN="..."
      ```

If you don't have access to 1Password, ask a team member who has done a deploy.

Tip: Use [as-a](https://github.com/bahmutov/as-a) to manage environment variables for different situations.

### Before Publishing a New Version

In order to publish a new version of the `cypress` package to the npm registry, CI must build and test it across multiple platforms and test projects. CI is set up to do the following on every commit to `develop`:

1. Build the npm package with the [next target version](./next-version.md) baked in.
2. Build the Linux, Mac & Windows binaries on CircleCI.
3. Upload the binaries and the new npm package to the AWS S3 Bucket `cdn.cypress.io` under the "beta" folder.
4. [Launch test projects](./testing-other-projects.md) using the newly-uploaded package & binary instead of installing from the npm registry.

Multiple test projects are launched for each target operating system and the results are reported
back to GitHub using status checks so that you can see if a change has broken real-world usage
of Cypress. You can see the progress of the test projects by opening the status checks on GitHub:

![Screenshot of status checks](https://i.imgur.com/AsQwzgO.png)

### Steps to Publish a New Version

In the following instructions, "X.Y.Z" is used to denote the [next version of Cypress being published](./next-version.md).

1. Confirm that every issue labeled [stage: pending release](https://github.com/cypress-io/cypress/issues?q=label%3A%22stage%3A+pending+release%22+is%3Aclosed) has a ZenHub release set. **Tip:** there is a command in [`release-automations`](https://github.com/cypress-io/release-automations)'s `issues-in-release` tool to list and check such issues. Without a ZenHub release issues will not be included in the right changelog. Also ensure that every closed issue in any obsolete releases are moved to the appropriate release in ZehHub. For example, if the open releases are 9.5.5 and 9.6.0, the current release is 9.6.0, then all closed issues marked as 9.5.5 should be moved to 9.6.0. Ensure that there are no commits on `develop` since the last release that are user facing and aren't marked with the current release.

2. If there is a new [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink/releases) version, update the corresponding dependency in [`packages/example`](../packages/example) to that new version.

3. Once the `develop` branch is passing for all test projects with the new changes and the `linux-x64` binary is present at `https://cdn.cypress.io/beta/binary/X.Y.Z/linux-x64/develop-<sha>/cypress.zip`, and the `linux-x64` cypress npm package is present at `https://cdn.cypress.io/beta/npm/X.Y.Z/linux-x64/develop-<sha>/cypress.tgz`, publishing can proceed.

4. Install and test the pre-release version to make sure everything is working.
    - Get the pre-release version that matches your system from the latest develop commit.
    - Install the new version: `npm install -g <cypress.tgz path>`
    - Run a quick, manual smoke test:
        - `cypress open`
        - Go into a project, run a quick test, make sure things look right
    - Optionally, install the new version into an established project and run the tests there
        - [cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app) uses yarn and represents a typical consumer implementation.
    - Optionally, do more thorough tests, for example test the new version of Cypress against the Cypress Dashboard repo.

5. Log into AWS SSO with `aws sso login --profile <name_of_profile>`. If you have setup your credentials under a different profile than `prod`, be sure to set the `AWS_PROFILE` environment variable to that profile name for the remaining steps. For example, if you are using `production` instead of `prod`, do `export AWS_PROFILE=production`.

6. Use the `prepare-release-artifacts` script (Mac/Linux only) to prepare the latest commit to a stable release. When you run this script, the following happens:
    * the binaries for `<commit sha>` are moved from `beta` to the `desktop` folder for `<new target version>` in S3
    * the Cloudflare cache for this version is purged
    * the pre-prod `cypress.tgz` NPM package is converted to a stable NPM package ready for release

    ```shell
    yarn prepare-release-artifacts --sha <commit sha> --version <new target version>
    ```

    You can pass `--dry-run` to see the commands this would run under the hood.

7. Validate you are logged in to `npm` with `npm whoami`. Otherwise log in with `npm login`.

8. Publish the generated npm package under the `dev` tag, using your personal npm account.

    ```shell
    npm publish /tmp/cypress-prod.tgz --tag dev
    ```

9. Double-check that the new version has been published under the `dev` tag using `npm info cypress` or [available-versions](https://github.com/bahmutov/available-versions). `latest` should still point to the previous version. Example output:

    ```shell
    dist-tags:
    dev: 3.4.0     latest: 3.3.2
    ```

10. Test `cypress@X.Y.Z` to make sure everything is working.
    - Install the new version: `npm install -g cypress@X.Y.Z`
    - Run a quick, manual smoke test:
        - `cypress open`
        - Go into a project, run a quick test, make sure things look right
    - Install the new version into an established project and run the tests there
        - [cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app) uses yarn and represents a typical consumer implementation.
    - Optionally, do more thorough tests, for example test the new version of Cypress against the Cypress Dashboard repo.

11. Create or review the release-specific documentation and changelog in [cypress-documentation](https://github.com/cypress-io/cypress-documentation). If there is not already a release-specific PR open, create one. This PR must be merged, built, and deployed before moving to the next step.
     - Use [`release-automations`](https://github.com/cypress-io/release-automations)'s `issues-in-release` tool to generate a starting point for the changelog, based off of ZenHub:
        ```shell
        cd packages/issues-in-release
        yarn do:changelog --release <release label>
        ```
    - Ensure the changelog is up-to-date and has the correct date.
    - Merge any release-specific documentation changes into the main release PR.
    - You can view the doc's [branch deploy preview](https://github.com/cypress-io/cypress-documentation/blob/master/CONTRIBUTING.md#pull-requests) by clicking 'Details' on the PR's `netlify-cypress-docs/deploy-preview` GitHub status check.

12. Create a PR for a new docker image in [`cypress-docker-images`](https://github.com/cypress-io/cypress-docker-images) under `included` for the new cypress version. Note: we use the base image with the Node version matching the bundled Node version. Instructions for updating `cypress-docker-images` can be found [here](https://github.com/cypress-io/cypress-docker-images/blob/master/CONTRIBUTING.md#add-new-included-image). Ensure the docker image is reviewed and has passing tests before preceeding.


13. Make the new npm version the "latest" version by updating the dist-tag `latest` to point to the new version:

    ```shell
    npm dist-tag add cypress@X.Y.Z
    ```

14. Run `binary-release` to update the [download server's manifest](https://download.cypress.io/desktop.json). This will also ensure the binary for the version is downloadable for each system.

    ```shell
    yarn binary-release --version X.Y.Z
    ```

15. If needed, push out any updated changes to the links manifest to [`on.cypress.io`](https://github.com/cypress-io/cypress-services/tree/develop/packages/on).

16. Merge the new docker image PR created in step 13 to release the image.

17. If needed, deploy the updated [`cypress-example-kitchensink`][cypress-example-kitchensink] to `example.cypress.io` by following [these instructions under "Deployment"](../packages/example/README.md).

18. Update the releases in [ZenHub](https://app.zenhub.com/workspaces/test-runner-5c3ea3baeb1e75374f7b0708/reports/release):
    - Close the current release in ZenHub.
    - Create a new patch release (and a new minor release, if this is a minor release) in ZenHub, and schedule them both to be completed 2 weeks from the current date.
    - Move all issues that are still open from the current release to the appropriate future release.

19. Bump `version` in [`package.json`](package.json), submit, get approvals on, and merge a new PR for the change. 

20. After the PR to bump the  [`package.json`](package.json) version merges:

    ```shell
    git checkout develop
    git pull origin develop
    git log --pretty=oneline
    # copy sha of the previous commit
    git tag -a vX.Y.Z -m vX.Y.Z <sha>
    git push origin vX.Y.Z
    ```

21. Create a new [GitHub release](https://github.com/cypress-io/cypress/releases). Choose the tag you created previously and add contents to match previous releases.

22. Inside of [cypress-io/release-automations][release-automations], run the following to add a comment to each GH issue that has been resolved with the new published version:

    ```shell
    cd packages/issues-in-release && npm run do:comment -- --release X.Y.Z
    ```

23. Confirm there are no issues with the label [stage: pending release](https://github.com/cypress-io/cypress/issues?q=label%3A%22stage%3A+pending+release%22+is%3Aclosed) left

24. Check all `cypress-test-*` and `cypress-example-*` repositories, and if there is a branch named `x.y.z` for testing the features or fixes from the newly published version `x.y.z`, update that branch to refer to the newly published NPM version in `package.json`. Then, get the changes approved and merged into that project's main branch. For projects without a `x.y.z` branch, you can go to the Renovate dependency issue and check the box next to `Update dependency cypress to X.Y.Z`. It will automatically create a PR. Once it passes, you can merge it. Try updating at least the following projects:
    - [cypress-example-todomvc](https://github.com/cypress-io/cypress-example-todomvc/issues/99)
    - [cypress-example-todomvc-redux](https://github.com/cypress-io/cypress-example-todomvc-redux/issues/1)
    - [cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app/issues/41)
    - [cypress-example-recipes](https://github.com/cypress-io/cypress-example-recipes/issues/225)
    - [cypress-fiddle](https://github.com/cypress-io/cypress-fiddle/issues/5)
    - [cypress-example-docker-compose](https://github.com/cypress-io/cypress-example-docker-compose)

Take a break, you deserve it! 👉😎👉

[release-automations]: https://github.com/cypress-io/release-automations
[cypress-example-kitchensink]: https://github.com/cypress-io/cypress-example-kitchensink
