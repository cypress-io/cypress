const reSymbols = /[-\/\\^$*+?.()|[\]{}]/g

const escapeRegexp = (str: string): string => {
  return str.replace(reSymbols, '\\$&')
}

export default escapeRegexp

export { escapeRegexp }

module.exports = escapeRegexp
