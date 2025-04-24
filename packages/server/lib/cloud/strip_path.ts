import { last } from 'lodash'

// strip everything but the file name to remove any sensitive
// data in the path
const pathRe = /'?((\/|\\+|[a-z]:\\)[^\s']+)+'?/ig
const pathSepRe = /[\/\\]+/

export const stripPath = (text: string) => {
  return (text || '').replace(pathRe, (path) => {
    const fileName = last(path.split(pathSepRe)) || ''

    return `<stripped-path>${fileName}`
  })
}
