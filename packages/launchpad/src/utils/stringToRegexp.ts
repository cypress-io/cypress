export function stringToRegexp (s: string): RegExp {
  return new RegExp(s)
}

export interface FilePart {
  text: string
  highlight: boolean
}

export function formatMigrationFile (file: string, regexp: RegExp): FilePart[] {
  const match = regexp.exec(file)

  if (!match?.groups) {
    throw Error(`Expected groups in ${file} using ${regexp}`)
  }

  const higlights = Object.values(match.groups)
  const delimiters = higlights.join('|')
  const re = new RegExp(`(${delimiters})`)
  const split = file.split(re)

  return split.map<FilePart>((text) => {
    return {
      text,
      highlight: higlights.includes(text),
    }
  })
}
