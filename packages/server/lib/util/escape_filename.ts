import _ from 'lodash'

const ampersandRe = /&/g
const percentRe = /%/g
const questionRe = /\?/g

export function escapeFilenameInUrl (url: string) {
  let paths = url.split('/')

  // escape valid file name characters that cannot be used in URL
  paths[paths.length - 1] = (_.last<string>(paths) || '')
  .replace(percentRe, '%25') // %
  .replace(ampersandRe, '%26') // &
  .replace(questionRe, '%3F') // ? -> it's only valid in Linux

  return paths.join('/')
}
