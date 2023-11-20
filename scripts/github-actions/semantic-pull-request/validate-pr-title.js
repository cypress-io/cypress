const parser = require('conventional-commits-parser').sync
const { changeCatagories, parserOpts } = require('../../semantic-commits/change-categories')

const types = Object.keys(changeCatagories)

function _validateTitle (prTitle) {
  const result = parser(prTitle, parserOpts)

  function printAvailableTypes () {
    return `Available types:\n${types
    .map((type) => ` - ${type}: ${changeCatagories[type].description}`)
    .join('\n')}`
  }

  if (!result.type) {
    throw new Error(
      `No release type found in pull request title "${prTitle}". Add a prefix to indicate what kind of release this pull request corresponds to. Cypress types are:/\n\n${printAvailableTypes()}`,
    )
  }

  if (!result.subject) {
    throw new Error(`No subject found in pull request title "${prTitle}".`)
  }

  if (!types.includes(result.type)) {
    throw new Error(
      `Unknown release type "${result.type}" found in pull request title "${prTitle}".
      \n\n${printAvailableTypes()}`,
    )
  }

  return result
}

async function validatePrTitle ({ github, prTitle, restParameters }) {
  let result = _validateTitle(prTitle)

  const commits = []
  let nonMergeCommits = []

  for await (const response of github.paginate.iterator(
    github.rest.pulls.listCommits,
    restParameters,
  )) {
    commits.push(...response.data)

    // GitHub does not count merge commits when deciding whether to use
    // the PR title or a commit message for the squash commit message.
    nonMergeCommits = commits.filter((commit) => {
      return commit.parents.length < 2
    })

    // We only need two non-merge commits to know that the PR
    // title won't be used.
    if (nonMergeCommits.length >= 2) break
  }

  // If there is only one (non merge) commit present, GitHub will use
  // that commit rather than the PR title for the title of a squash
  // commit. To make sure a semantic title is used for the squash
  // commit, we need to validate the commit title.
  if (nonMergeCommits.length === 1) {
    try {
      result = _validateTitle(nonMergeCommits[0].commit.message)
    } catch (error) {
      throw new Error(
        `Pull request has only one commit and it's not semantic; this may lead to a non-semantic commit in the base branch (see https://github.community/t/how-to-change-the-default-squash-merge-commit-message/1155). Amend the commit message to match the pull request title, or add another commit.`,
      )
    }
  }

  return result
}

module.exports = {
  validatePrTitle,
  _validateTitle,
}
