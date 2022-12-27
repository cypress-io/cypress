// @ts-check

// Universal code - should run in Node or in the browser

/**
 * Parses test title grep string.
 * The string can have "-" in front of it to invert the match.
 * @param {string} s Input substring of the test title
 */
function parseTitleGrep (s) {
  if (!s || typeof s !== 'string') {
    return null
  }

  s = s.trim()
  if (s.startsWith('-')) {
    return {
      title: s.substring(1),
      invert: true,
    }
  }

  return {
    title: s,
    invert: false,
  }
}

function parseFullTitleGrep (s) {
  if (!s || typeof s !== 'string') {
    return []
  }

  // separate each title
  return s.split(';').map(parseTitleGrep)
}

/**
 * Parses tags to grep for.
 * @param {string} s Tags string like "@tag1+@tag2"
 */
function parseTagsGrep (s) {
  if (!s) {
    return []
  }

  const explicitNotTags = []

  // top level split - using space or comma, each part is OR
  const ORS = s
  .split(/[ ,]/)
  // remove any empty tags
  .filter(Boolean)
  .map((part) => {
    // now every part is an AND
    if (part.startsWith('--')) {
      explicitNotTags.push({
        tag: part.slice(2),
        invert: true,
      })

      return
    }

    const parsed = part.split('+').map((tag) => {
      if (tag.startsWith('-')) {
        return {
          tag: tag.slice(1),
          invert: true,
        }
      }

      return {
        tag,
        invert: false,
      }
    })

    return parsed
  })

  // filter out undefined from explicit not tags
  const ORS_filtered = ORS.filter((x) => x !== undefined)

  if (explicitNotTags.length > 0) {
    ORS_filtered.forEach((OR, index) => {
      ORS_filtered[index] = OR.concat(explicitNotTags)
    })

    if (ORS_filtered.length === 0) {
      ORS_filtered[ 0 ] = explicitNotTags
    }
  }

  return ORS_filtered
}

function shouldTestRunTags (parsedGrepTags, tags = []) {
  if (!parsedGrepTags.length) {
    // there are no parsed tags to search for, the test should run
    return true
  }

  // now the test has tags and the parsed tags are present

  // top levels are OR
  const onePartMatched = parsedGrepTags.some((orPart) => {
    const everyAndPartMatched = orPart.every((p) => {
      if (p.invert) {
        return !tags.includes(p.tag)
      }

      return tags.includes(p.tag)
    })
    // console.log('every part matched %o?', orPart, everyAndPartMatched)

    return everyAndPartMatched
  })

  // console.log('onePartMatched', onePartMatched)
  return onePartMatched
}

function shouldTestRunTitle (parsedGrep, testName) {
  if (!testName) {
    // if there is no title, let it run
    return true
  }

  if (!parsedGrep) {
    return true
  }

  if (!Array.isArray(parsedGrep)) {
    console.error('Invalid parsed title grep')
    console.error(parsedGrep)
    throw new Error('Expected title grep to be an array')
  }

  if (!parsedGrep.length) {
    return true
  }

  const inverted = parsedGrep.filter((g) => g.invert)
  const straight = parsedGrep.filter((g) => !g.invert)

  return (
    inverted.every((titleGrep) => !testName.includes(titleGrep.title)) &&
    (!straight.length ||
      straight.some((titleGrep) => testName.includes(titleGrep.title)))
  )
}

// note: tags take precedence over the test name
function shouldTestRun (parsedGrep, testName, tags = [], grepUntagged = false) {
  if (grepUntagged) {
    return !tags.length
  }

  if (Array.isArray(testName)) {
    // the caller passed tags only, no test name
    tags = testName
    testName = undefined
  }

  return (
    shouldTestRunTitle(parsedGrep.title, testName) &&
    shouldTestRunTags(parsedGrep.tags, tags)
  )
}

function parseGrep (titlePart, tags) {
  return {
    title: parseFullTitleGrep(titlePart),
    tags: parseTagsGrep(tags),
  }
}

module.exports = {
  parseGrep,
  parseTitleGrep,
  parseFullTitleGrep,
  parseTagsGrep,
  shouldTestRun,
  shouldTestRunTags,
  shouldTestRunTitle,
}
