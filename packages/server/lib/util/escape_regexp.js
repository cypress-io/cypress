const reSymbols = /[-\/\\^$*+?.()|[\]{}]/g

module.exports = (str) => {
  return str.replace(reSymbols, '\\$&')
}
