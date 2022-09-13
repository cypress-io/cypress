// eslint-disable-next-line no-undef
const _globalThis = globalThis

Object.entries(_globalThis.originalMochaMethods).forEach(([key, value]) => {
  _globalThis[key] = Object.assign(_globalThis[key], value)
})
