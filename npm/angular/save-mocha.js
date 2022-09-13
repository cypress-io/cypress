// eslint-disable-next-line no-undef
const _globalThis = globalThis

_globalThis.originalMochaMethods = {
  describe: _globalThis.describe,
  it: _globalThis.it,
  specify: _globalThis.specify,
}
