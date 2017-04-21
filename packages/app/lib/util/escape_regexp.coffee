reSymbols = /[-\/\\^$*+?.()|[\]{}]/g

module.exports = (str) ->
  str.replace(reSymbols, '\\$&');