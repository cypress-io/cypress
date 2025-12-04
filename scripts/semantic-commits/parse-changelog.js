const fs = require('fs')
const path = require('path')
const { userFacingChanges } = require('./change-categories')
const userFacingSections = Object.values(userFacingChanges).map(({ section }) => section)

const HEADER_PREVIEW_LINE_COUNT = 7

const normalizeChangelogContent = (content) => {
  return content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

const releaseLinePatterns = {
  pending: [
    /_Released \d+\/\d+\/\d+ \(PENDING\)_/,
    /_Released xx\/xx\/xxxx \(PENDING\)_/i,
  ],
  released: [/_Released \d+\/\d+\/\d+_/],
}

const findReleaseLineIndex = (lines, pendingRelease) => {
  const patterns = pendingRelease ? releaseLinePatterns.pending : releaseLinePatterns.released
  const maxIndex = Math.min(lines.length - 1, HEADER_PREVIEW_LINE_COUNT)

  for (let i = 0; i <= maxIndex; i++) {
    const trimmedLine = lines[i].trim()

    if (!trimmedLine) {
      continue
    }

    const hasMatch = patterns.some((pattern) => pattern.test(trimmedLine))

    if (hasMatch) {
      return i
    }
  }

  return -1
}

async function parseChangelog ({ pendingRelease = true, changelogContent = null } = {}) {
  const changelog = normalizeChangelogContent(changelogContent || fs.readFileSync(path.join(__dirname, '..', '..', 'cli', 'CHANGELOG.md'), 'utf8'))
  const changeLogLines = changelog.split('\n')
  const releaseLineIndex = findReleaseLineIndex(changeLogLines, pendingRelease)
  const headerPreview = changeLogLines.slice(0, HEADER_PREVIEW_LINE_COUNT + 1)
    .map((line, idx) => `${idx + 1}: ${JSON.stringify(line)}`).join('\n')

  console.log('Changelog header preview:\n' + headerPreview)

  if (releaseLineIndex === -1) {
    const expected = pendingRelease ? '"_Released xx/xx/xxxx (PENDING)_"' : '"_Released xx/xx/xxxx_"'

    throw new Error(`Could not locate ${expected} within the first ${HEADER_PREVIEW_LINE_COUNT + 1} lines of cli/CHANGELOG.md.`)
  }

  let parseChangelog = true
  const sections = {}
  let currentSection = ''
  let content = []
  let index = 0
  let nextKnownLineBreak = 2

  while (parseChangelog) {
    index++
    if (index >= changeLogLines.length) {
      sections[currentSection] = content
      parseChangelog = false
      break
    }

    const line = changeLogLines[index]
    const trimmedLine = line.trim()

    // reached next release section
    if (index > 1 && /^## \d+\.\d+\.\d+/.test(trimmedLine)) {
      sections[currentSection] = content
      parseChangelog = false
    }

    if (index === 1) {
      if (!/^## \d+\.\d+\.\d+/.test(trimmedLine)) {
        throw new Error(`Expected line number ${index + 1} to include "## x.x.x"`)
      }

      sections['version'] = trimmedLine
    } else if (index === releaseLineIndex) {
      nextKnownLineBreak = index + 1
      sections['releaseDate'] = trimmedLine
    } else if (index === nextKnownLineBreak) {
      if (trimmedLine !== '') {
        throw new Error(`Expected line number ${index + 1} to be a line break`)
      }
    } else if (trimmedLine === '') {
      continue
    } else {
      const result = /^\*\*.+?:\*\*/.exec(trimmedLine)

      if (currentSection === '' && !result) {
        throw new Error(`Expected line number ${index + 1} to be a valid section header. Received ${line}. Expected one of ...\n  - ${userFacingSections.join('\n  - ')}`)
      }

      if (result) {
        const section = result[0]

        if (!userFacingSections.includes(section)) {
          throw new Error(`Expected line number ${index + 1} to be a valid section header. Received ${section}. Expected one of ...\n  - ${userFacingSections.join('\n  - ')}`)
        }

        if (result === currentSection || sections[section]) {
          throw new Error(`Duplicate section header of "${section}" on line number ${index + 1}. Condense change content under a single section header.`)
        }

        if (currentSection !== '') {
          sections[currentSection] = content
        }

        content = []
        currentSection = section
        nextKnownLineBreak = index + 1
      } else {
        content.push(line)
      }
    }
  }

  return sections
}

if (require.main !== module) {
  module.exports.parseChangelog = parseChangelog

  return
}

(async () => {
  await parseChangelog()
})()
