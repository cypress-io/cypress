const childProcess = require('child_process')
const _ = require('lodash')
const { VERSION_HEADER, SECTION_HEADER } = require('./parse-changelog')

const CHANGELOG_PATH = 'cli/CHANGELOG.md'
const ENTRY = /^\s*- /
const MAX_ENTRY_LENGTH = 120

const git = (args) => childProcess.execSync(`git ${args}`, { encoding: 'utf8' }).trim()

// Diffing against the merge base rather than the base branch's tip keeps entries that
// landed on the base branch after this branch was cut from being reported as its own.
function getChangelogDiff (baseBranch = process.env.CHANGELOG_BASE_BRANCH || 'develop') {
  const baseRef = `origin/${baseBranch}`

  try {
    git(`rev-parse --verify --quiet ${baseRef}`)
  } catch {
    git(`fetch --no-tags origin ${baseBranch}:refs/remotes/${baseRef}`)
  }

  const mergeBase = git(`merge-base ${baseRef} HEAD`)

  return git(`diff --unified=0 ${mergeBase} -- ${CHANGELOG_PATH}`)
}

// A hunk that also removes lines edits an existing entry rather than adding one, so it
// is skipped: fixing a typo in an already-released entry is allowed.
function getAddedEntries (diff) {
  const entries = []
  let hunk = null

  diff.split('\n').forEach((line) => {
    const header = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,\d+)? @@/.exec(line)

    if (header) {
      hunk = { removesLines: header[1] !== '0', lineNumber: Number(header[2]) }

      return
    }

    if (!hunk || !line.startsWith('+')) {
      return
    }

    const content = line.slice(1)

    if (!hunk.removesLines && ENTRY.test(content)) {
      entries.push({ lineNumber: hunk.lineNumber, text: content.trim() })
    }

    hunk.lineNumber++
  })

  return entries
}

function _findHeaders (changelogLines, lineNumber) {
  let section

  for (let index = lineNumber - 2; index >= 0; index--) {
    const line = changelogLines[index]

    if (!section && SECTION_HEADER.test(line)) {
      section = SECTION_HEADER.exec(line)[0]
    }

    const version = VERSION_HEADER.exec(line)

    if (version) {
      return { version: version[1], section }
    }
  }

  return {}
}

function validateChangelogPlacement ({ diff, changelogContent, releasedVersions }) {
  const changelogLines = changelogContent.split('\n')
  const topVersion = changelogLines.map((line) => VERSION_HEADER.exec(line)).find(Boolean)?.[1]
  const isTopVersionReleased = releasedVersions.includes(topVersion)

  return getAddedEntries(diff).flatMap(({ lineNumber, text }) => {
    const { version, section } = _findHeaders(changelogLines, lineNumber)

    if (!version || !releasedVersions.includes(version)) {
      return []
    }

    const sectionHint = section ? ` under ${section}` : ''
    const destination = isTopVersionReleased
      ? `Move it${sectionHint} in a new "## <next version>" release added above "## ${topVersion}". Merge the latest develop first, since it may already have one.`
      : `Move it${sectionHint} in ${topVersion}, the next unreleased version.`

    return [`The changelog entry on line ${lineNumber} of ${CHANGELOG_PATH} was added under ${version}, which has already been released:\n\n  ${_.truncate(text, { length: MAX_ENTRY_LENGTH, omission: '…' })}\n\n${destination}`]
  })
}

module.exports = {
  getChangelogDiff,
  getAddedEntries,
  validateChangelogPlacement,
}
