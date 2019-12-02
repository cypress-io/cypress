<!--
  this comment will be posted automatically by Cypress bot whenever a dependency update pull request is opened,
  and it helps the reviewer from Cypress team to ensure the update won't have unexpected consequences.
-->
Below are some guidelines Cypress uses when reviewing dependency updates.

## Dependency Update Instructions

- Read through the entire changelog of the dependency's changes. If a changelog is not available, check every commit made to the dependency. **NOTE** - do not rely on semver to indicate breaking changes - every product does not follow this standard.
- Add a PR review comment noting any relevant changes in the dependency.
- If any of the following requirements cannot be met, leave a comment in the review selecting 'Request changes', otherwise 'Approve'.

## Dependency Updates Checklist

- Code using the dependency has been updated to accommodate any breaking changes
- The dependency still supports the version of Node that the package requires.
- The PR been tagged with a release in ZenHub.
- Appropriate labels have been added to the PR (for example: label \`type: breaking change\` if it is a breaking change)
