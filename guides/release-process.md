# Release Process

These procedures concern the release process for the Cypress binary and `cypress` npm module.

The `@cypress/`-namespaced NPM packages that live inside the [`/npm`](../npm) directory are automatically published to npm (with [`semantic-release`](https://semantic-release.gitbook.io/semantic-release/)) upon being merged into `develop`. You can read more about this in [CONTRIBUTING.md](../CONTRIBUTING.md#releases).

[Anyone can build the binary and npm package locally](./building-release-artifacts.md), but you can only deploy the Cypress application and publish the npm module `cypress` if you are a member of the `cypress` npm organization.

## Publishing

### Prerequisites

- Ensure you have the following permissions set up:
  - An AWS account with permission to access and write to the AWS S3, i.e. the Cypress CDN.
  - Permissions for your npm account to publish the `cypress` package.

- [Set up](https://cypress-io.atlassian.net/wiki/spaces/INFRA/pages/1534853121/AWS+SSO+Cypress) an AWS SSO profile with the [Team-CypressApp-Prod](https://cypress-io.atlassian.net/wiki/spaces/INFRA/pages/1534853121/AWS+SSO+Cypress#Team-CypressApp-Prod) role. The release scripts assumes the name of your profile is `prod`. Make sure to open the "App Developer" expando for some necessary config values. Your AWS config file should end up looking like the following:

    ```
    [profile prod]
    sso_start_url = <start_url>
    sso_region = <region>
    sso_account_id = <account_id>
    sso_role_name = <role_name>
    region = <region>
    cli_pager = <pager>
    ```

- Set up the following environment variables:
  - For the `release-automations` step, you will need setup the following envs:
    - GitHub token - Found in 1Password.
    - The `cypress-bot` GitHub app credentials. Found in 1Password.
    ```text
    GITHUB_TOKEN="..."
    GITHUB_APP_CYPRESS_INSTALLATION_ID=
    GITHUB_APP_ID=
    GITHUB_PRIVATE_KEY=
    ```

  - For purging the Cloudflare cache (needed for the `prepare-release-artifacts` script in step 6), you'll need `CF_ZONEID` and `CF_TOKEN` set. These can be found in 1Password.
      ```text
      CF_ZONEID="..."
      CF_TOKEN="..."
      ```

- Ensure that you have the following repositories checked out locally and ready to contribute to:
  - [`cypress-realworld-app`](https://github.com/cypress-io/cypress-realworld-app)
  - [`cypress-documentation`](https://github.com/cypress-io/cypress-documentation)
  - [`cypress-docker-images`](https://github.com/cypress-io/cypress-docker-images)
  - [cypress-io/release-automations][release-automations]


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

_Note: It is advisable to notify the team that the `develop` branch is locked down prior to beginning the release process_

1. Install and test the pre-release version to make sure everything is working. See [Install Pre-Release Version docs](https://docs.cypress.io/guides/references/advanced-installation#Install-pre-release-version) for more details.
    - Install the new version:
        - Globally: `npm install -g <cypress.tgz path>`
        - or in a project: `npm i -D cypress@file:<cypress.tgz path>`
    - Run a quick, manual smoke test:
        - `cypress open`
        - Go into a project, run a quick test, make sure things look right
    - Optionally, install the new version into an established project and run the tests there
        - [cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app) uses yarn and represents a typical consumer implementation.
    - Optionally, do more thorough tests, for example test the new version of Cypress against the Cypress Cloud repo.

2. Ensure all changes to the links manifest to [`on.cypress.io`](https://github.com/cypress-io/cypress-services/tree/develop/packages/on) have been merged to `develop` and deployed.

3. Create a Release PR -
   Bump, submit, get approvals on, and merge a new PR. This PR should:
    - Bump the Cypress `version` in [`package.json`](package.json)
    - Bump the [`packages/example`](../packages/example) dependency if there is a new [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink/releases) version, and `yarn` to ensure the lockfile is up to date.
    - Follow the writing the [Cypress Changelog release steps](./writing-the-cypress-changelog.md#release) to update the [`cli/CHANGELOG.md`](../cli/CHANGELOG.md).

4. Once the `develop` branch is passing in CI and you have confirmed the `cypress-bot` has commented on the commit with the pre-release versions for `darwin-x64`, `darwin-arm64`, `linux-x64`,`linux-arm64`, and `win32-x64`, publishing can proceed.
    Tips for getting a green build:
     - If the `windows` workflow is failing with timeout errors, you can retry from the last failed step.
     - Sometimes a test can get stuck in a failing state between attempts on the `windows` workflow. In these cases, kicking off a full run of the workflow can help get it into a passing state.
     - If the `linux-x64` workflow fails due to a flaky test but percy finalizes the build, you *must* restart the workflow from the failed steps. Restarting the entire workflow after a finalized Percy build can cause Percy to fail the next attempt with a "Build has already been finalized" error, requiring pushing a new commit to start fresh.

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
   If you are not already a Cypress package maintainer, contact a team member who is to get you added.

8. Publish the generated npm package under the `dev` tag, using your personal npm account.

    ```shell
    npm publish /tmp/cypress-prod.tgz --tag dev
    ```

9. Double-check that the new version has been published under the `dev` tag using `npm info cypress` or [available-versions](https://github.com/bahmutov/available-versions). `latest` should still point to the previous version. Example output:

    ```shell
    dist-tags:
    dev: 3.4.0     latest: 3.3.2
    ```

    **Note**: It may take several minutes for `npm info` to reflect the latest version info.

10. Test `cypress@X.Y.Z` to make sure everything is working.
    - Install the new version: `npm install -g cypress@X.Y.Z`
    - Run a quick, manual smoke test:
        - `cypress open`
        - Go into a project, run a quick test, make sure things look right
    - Install the new version into an established project and run the tests there
        - [cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app) uses yarn and represents a typical consumer implementation.
    - Optionally, do more thorough tests, for example test the new version of Cypress against the Cypress Cloud repo.

11. Review the release-specific documentation and changelog PR in [cypress-documentation](https://github.com/cypress-io/cypress-documentation). If there is not already a release-specific PR open, create one.
    - Copy the changelog content for this version from the release PR above into `/docs/guides/references/changelog.mdx`. Adjust any `docs.cypress.io` links to use host-relative paths.
    - Merge any release-specific documentation changes into the main release PR.
    - You can view the doc's [branch deploy preview](https://github.com/cypress-io/cypress-documentation/blob/master/CONTRIBUTING.md#pull-requests) by clicking 'Details' on the PR's `netlify-cypress-docs/deploy-preview` GitHub status check.

12. Create a new docker image using the new cypress version in [`cypress-docker-images`](https://github.com/cypress-io/cypress-docker-images). Create a PR in which you update [factory/.env](https://github.com/cypress-io/cypress-docker-images/blob/master/factory/.env#L20) to use the new cypress version. Ensure the docker image is reviewed and has passing tests before proceeding.

13. Make the new npm version the "latest" version by updating the dist-tag `latest` to point to the new version:

    ```shell
    npm dist-tag add cypress@X.Y.Z
    ```

14. Run `binary-release` to update the [download server's manifest](https://download.cypress.io/desktop.json). This will also ensure the binary for the version is downloadable for each system.

    ```shell
    yarn binary-release --version X.Y.Z
    ```

15. Merge the documentation PR from step 11 and the new docker image PR created in step 12 to release the image.

16. If needed, deploy the updated [`cypress-example-kitchensink`][cypress-example-kitchensink] to `example.cypress.io` by following [these instructions under "Deployment"](../packages/example/README.md).
    - Build `@packages/example` with `yarn workspace @packages/example build`
    - Inspect the contents of `./packages/example/build` before deploying, and ensure it looks correct
    - Run `yarn workspace @packages/example deploy`. This adds changes from `cypress-example-kitchensink` to a commit in the `gh-pages` branch, which will deploy to production with its own CI.
    - Check the deployed site at `https://example.cypress.io` to ensure the new changes deployed correctly.

17. Once the release is complete, create a Github tag off of the release commit which bumped the version:
    ```shell
    git checkout develop
    git pull origin develop
    git log --pretty=oneline
    # copy sha of the version bump commit
    git tag -a vX.Y.Z -m vX.Y.Z <sha>
    git push origin vX.Y.Z
    ```

18. Create a new [GitHub release](https://github.com/cypress-io/cypress/releases). Choose the tag you created previously and add contents to match previous releases.

19. Add a comment to each GH issue that has been resolved with the new published version. Download the `releaseData.json` artifact from the `verify-release-readiness` CircleCI job and run the following command inside of [cypress-io/release-automations][release-automations]:

    ```shell
    npm run do:comment -- --release-data <path_to_releaseData.json>
    ```

22. Confirm there are no issues from the release with the label [stage: pending release](https://github.com/cypress-io/cypress/issues?q=label%3A%22stage%3A+pending+release%22+is%3Aclosed) left.

23. Notify the team that `develop` is reopen, and post a message to the Releases Slack channel with a link to the changelog.

24. If utilizing the `SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES` to override and skip changelog validation for this release, change its value as needed or delete it from CircleCI so that subsequent releases and PRs will go through changelog validation.

25. Check all `cypress-test-*` and `cypress-example-*` repositories, and if there is a branch named `x.y.z` for testing the features or fixes from the newly published version `x.y.z`, update that branch to refer to the newly published NPM version in `package.json`. Then, get the changes approved and merged into that project's main branch. For projects without a `x.y.z` branch, you can go to the Renovate dependency issue and check the box next to `Update dependency cypress to X.Y.Z`. It will automatically create a PR. Once it passes, you can merge it. Try updating at least the following projects:
    - [cypress-example-todomvc](https://github.com/cypress-io/cypress-example-todomvc/issues/99)
    - [cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app/issues/41)
    - [cypress-example-recipes](https://github.com/cypress-io/cypress-example-recipes/issues/225)

Take a break, you deserve it! 👉😎👉

[release-automations]: https://github.com/cypress-io/release-automations
[cypress-example-kitchensink]: https://github.com/cypress-io/cypress-example-kitchensink
