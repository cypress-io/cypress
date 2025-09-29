interface TitleGrep {
  title: string
  invert: boolean
}

interface TagGrep {
  tag: string
  invert: boolean
}

export const parseTitleGrep = (s: string): TitleGrep | null => {
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

export const parseFullTitleGrep = (s: string): TitleGrep[] => {
  if (!s || typeof s !== 'string') {
    return []
  }

  return s.split(';').map(parseTitleGrep)
}

export const parseTagsGrep = (s?: string): TagGrep[][] => {
  if (!s) {
    return []
  }

  const explicitNotTags: TagGrep[] = []

  const ORS = s
    .split(/[ ,]/)
    .filter(Boolean)
    .map((part) => {
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

  const ORS_filtered = ORS.filter((x) => x !== undefined)

  if (explicitNotTags.length > 0) {
    ORS_filtered.forEach((OR, index) => {
      ORS_filtered[index] = OR.concat(explicitNotTags)
    })

    if (ORS_filtered.length === 0) {
      ORS_filtered[0] = explicitNotTags
    }
  }

  return ORS_filtered
}

export const shouldTestRunTags = (parsedGrepTags: TagGrep[][], tags: string[] = []): boolean => {
  if (!parsedGrepTags.length) {
    return true
  }

  const onePartMatched = parsedGrepTags.some((orPart) => {
    const everyAndPartMatched = orPart.every((p) => {
      if (p.invert) {
        return !tags.includes(p.tag)
      }

      return tags.includes(p.tag)
    })

    return everyAndPartMatched
  })

  return onePartMatched
}

export const shouldTestRunTitle = (parsedGrep: TitleGrep[], testName: string): boolean => {
  if (!testName) {
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

export const shouldTestRun = (parsedGrep: { title: TitleGrep[], tags: TagGrep[][] }, testName: string, tags: string[] = [], grepUntagged: boolean = false): boolean => {
  if (grepUntagged) {
    return !tags.length
  }

  return (
    shouldTestRunTitle(parsedGrep.title, testName) &&
    shouldTestRunTags(parsedGrep.tags, tags)
  )
}

export const parseGrep = (titlePart: string, tags?: string): { title: TitleGrep[], tags: TagGrep[][] } => {
  return {
    title: parseFullTitleGrep(titlePart),
    tags: parseTagsGrep(tags),
  }
}
