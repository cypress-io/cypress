// strip everything but the file name to remove any sensitive
// data in the path
const pathRe = /'?((\/|\\+|[a-z]:\\)[^\s']+)+'?/ig
const pathSepRe = /[\/\\]+/

export const stripPath = (text: string) => {
  return (text || '').replace(pathRe, (path) => {
    const parts = path.split(pathSepRe)
    const fileName = parts[parts.length - 1] || ''

    return `<stripped-path>${fileName}`
  })
}
