// this tests that the tsconfig.json is loaded from the config/plugins directory.
// if it isn't, the lack of "downlevelIteration" support will cause this to
// fail at runtime with "RangeError: Invalid array length"
[...Array(100).keys()].map((x) => `${x}`)

module.exports = {
  'e2e': {
    'supportFile': false,
  },
}
