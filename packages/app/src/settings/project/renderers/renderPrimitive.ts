export function renderPrimitive (val: string | number | boolean | null |undefined): string {
  if (val === null || val === undefined) {
    return 'null'
  }

  if (typeof val === 'string') {
    if (val.startsWith('[Function')) {
      return `${val.slice(10, -1)} ( ) { ... }`
    }

    return `'${val.replaceAll('\'', '\\\'')}'`
  }

  return val.toString()
}
