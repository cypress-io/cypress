const fs = require('fs')
const path = require('path')
const { userFacingChanges } = require('./change-categories')
const userFacingSections = Object.values(userFacingChanges).map(({ section }) => section)

async function parseChangelog (pendingRelease = true) {
  const changelog = fs.readFileSync(path.join(__dirname, '..', '..', 'cli', 'CHANGELOG.md'), 'utf8')
  const changeLogLines = changelog.split('\n')

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

    // reached next release section
    if (index > 1 && /^## \d+\.\d+\.\d+/.test(line)) {
      sections[currentSection] = content
      parseChangelog = false
    }

    if (index === 1) {
      if (!/^## \d+\.\d+\.\d+/.test(line)) {
        throw new Error(`Expected line number ${index + 1} to include "## x.x.x"`)
      }

      sections['version'] = line
    } else if (index === 3) {
      nextKnownLineBreak = index + 1
      if (pendingRelease && !/_Released \d+\/\d+\/\d+ \(PENDING\)_/.test(line)) {
        throw new Error(`Expected line number ${index + 1} to include "_Released xx/xx/xxxx (PENDING)_"`)
      } else if (!pendingRelease && !/_Released \d+\/\d+\/\d+_/.test(line)) {
        throw new Error(`Expected line number ${index + 1} to include "_Released xx/xx/xxxx_"`)
      }

      sections['releaseDate'] = line
    } else if (index === nextKnownLineBreak) {
      if (line !== '') {
        throw new Error(`Expected line number ${index + 1} to be a line break`)
      }
    } else {
      const result = /^\*\*.+?:\*\*/.exec(line)

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
