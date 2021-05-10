module.exports = {
  // Plugin sets up prettier-plugin-x with custom parsers for JS and TS
  // We only use one setting from prettierx, the `indentChains` setting
  ...require('prettier-config-x'),
  printWidth: 120,
  semi: false,
  singleQuote: true,
  indentChains: false,
}
