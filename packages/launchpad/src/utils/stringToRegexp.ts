export function stringToRegexp (s: string): RegExp {
  return new RegExp(s)
}

export interface FilePart {
  text: string
  highlight: boolean
}
