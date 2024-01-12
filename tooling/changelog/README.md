## @tooling/changelog

Tool for creating consistent changesets in Cypress and for generating a Changelog form the changesets that follow the semantic commit rules defined for Cypress.

### Add a Changeset

Quick tool to create a changeset file in the expected format with a unique file name.

```bash
yarn add-change
```
You will be prompted for the change type and message.

Or shortcut with `-t` and `-m`

```bash
yarn add-change -t fix -me 'Fixed an issue...'
```

### Create the Changelog

Create the changelog for the release. Read the output to ensure nothing needs attention before committing the `cli/CHANGELOG.md` updates. This will delete the changesets to start fresh for the next release.

```bash
yarn create-changelog
```

#### Release Data

When this command execute, it will save the release data to `tmp/releaseData/releaseData.json`. Use this artifact to when running the [cypress-io/release-automations][release-automations] `do:comment` to tag the associated issues and PRs with the release information once the release has been successful.

```shell
cd packages/issues-in-release && npm run do:comment -- --release-data <path_to_releaseData.json>`
````

[release-automations]: https://github.com/cypress-io/release-automations
