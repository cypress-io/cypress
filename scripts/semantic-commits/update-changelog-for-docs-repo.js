let fs = require('fs')
const minimist = require('minimist')
const { parseChangelog } = require('./parse-changelog')

const DOCS_URL = 'https://docs.cypress.io'
const DOCS_CHANGELOG_RELATIVE_URL = '/guides/references/changelog'

const getChangelogContentForRelease = async () => {
  const { version, releaseDate, ...sections } = await parseChangelog(false)

  console.log('changelog')

  let changelog = `${version}\n\n${releaseDate}`

  Object.entries(sections).forEach(([section, entries]) => {
    changelog += `\n\n${section}\n\n`

    changelog += entries.map((entry) => {
      return entry.trim()
      // update 'https://docs.cypress.io/link_in_docs' to relative link of '/link_in_docs'
      .replaceAll(DOCS_URL, '')
      // update '/guides/references/changelog#10-0-0' to anchor link of '#10-0-0'
      .replaceAll(DOCS_CHANGELOG_RELATIVE_URL, '')
    }).join('\n')
  })

  return changelog += '\n'
}

const updateDocsRepoChangelog = async () => {
  const args = minimist(process.argv.slice(2), { boolean: false })

  if (!args['changelog-path']) {
    console.error('Missing argument: --changelog-path')
    console.error('You must pass the cypress-documentation repositoy\'s changelog path.')
    process.exit(1)
  }

  let changelog = fs.readFileSync(args['changelog-path'], 'utf8').split('\n')

  const releaseChangelog = await getChangelogContentForRelease()

  changelog.splice(4, 0, releaseChangelog)

  fs.writeFileSync(args['changelog-path'], changelog.join('\n'))
}

if (require.main !== module) {
  module.exports.getDocRepoChangelogContent = updateDocsRepoChangelog

  return
}

(async () => {
  await updateDocsRepoChangelog()
})()
