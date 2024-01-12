const { exit } = require('process')
const fs = require('node:fs/promises')
const path = require('path')

const verifyChangesets = require('./verify-changesets')
const { changelog } = require('../../../scripts/semantic-commits/validate-binary-changelog')
const { deleteChangesets } = require('./changeset')

const CHANGELOG = path.join(__dirname, '..', '..', '..', 'cli', 'CHANGELOG.md')

module.exports = async () => {
  const changesets = await verifyChangesets()

  if (!changesets) {
    console.log('No changes. Nothing to release.')
    exit(0)
  }

  const changelogContentToAdd = changelog(changesets)
  let currentChangelogContent = await fs.readFile(CHANGELOG, 'utf8')

  currentChangelogContent = currentChangelogContent.split('\n')

  // maintain comment on how to write the changelog
  const changelogComment = currentChangelogContent.shift()

  const updatedChangelog = [changelogComment].concat(changelogContentToAdd).concat(currentChangelogContent)

  await fs.writeFile(CHANGELOG, updatedChangelog, 'utf8')

  console.log('Changelog has been updated! Deleting all changesets for next release.')
  await deleteChangesets()
}

// 1. verify cypress next version
