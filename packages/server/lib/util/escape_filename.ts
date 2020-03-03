const ampersandRe = /&/g
const percentRe = /%/g
const questionRe = /\?/g

export function escapeFilenameInUrl (url: string) {
  // escape valid file name characters that cannot be used in URL
  return url
  .replace(percentRe, '%25') // %
  .replace(ampersandRe, '%26') // &
  .replace(questionRe, '%3F') // ? -> it's only valid in Linux
}
