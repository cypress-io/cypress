import dedent from 'dedent'

export interface FilePartNoHighlight {
  text: string
  highlight: false
}

export interface FilePartHighlight {
  text: string
  group: 'folder' | 'extension' | 'name'
  highlight: true
}

export type FilePart = FilePartNoHighlight | FilePartHighlight

export const supportFileRegexps = {
  e2e: {
    beforeRegexp: 'cypress[\\\\/]support[\\\\/](?<name>index)\.(?=[j|t]sx?)',
    afterRegexp: 'cypress[\\\\/]support[\\\\/](?<name>e2e)\.(?=[j|t]sx?)',
  },
} as const

export function formatMigrationFile (file: string, regexp: RegExp): FilePart[] {
  const match = regexp.exec(file)

  if (!match?.groups) {
    throw new Error(dedent`
      Expected groups main,ext or file in ${file} using ${regexp} when matching ${file}
      Perhaps this isn't a spec file, or it is an unexpected format?`)
  }

  // sometimes `.` gets in here as the <ext> group
  // filter it out
  const highlights = Object.values(match.groups)
  .filter((x) => x.length > 0)
  .map((d) => d === '.' ? `[${d}]` : d) // period is wildcard so surround with [] to use character

  const delimiters = highlights.join('|')
  const re = new RegExp(`(${delimiters})`)
  const split = file.split(re)

  return split.map<FilePart>((text) => {
    const group = text === match.groups?.main
      ? 'folder'
      : text === match.groups?.ext
        ? 'extension'
        : text === match.groups?.name
          ? 'name'
          : undefined

    const hasHighlight = text === '.' || highlights.includes(text)

    if (hasHighlight && group) {
      return {
        text,
        highlight: true,
        group,
      }
    }

    return {
      text,
      highlight: false,
    }
  })
}
