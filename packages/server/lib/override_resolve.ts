const Module = require('module')

// Hooks resolution rather than loading so `require.resolve` is redirected along with `require`.
export const overrideResolve = (redirect: (request: string) => string | undefined) => {
  const _resolveFilename = Module._resolveFilename

  Module._resolveFilename = function (request: string, ...rest: any[]) {
    return _resolveFilename.call(this, redirect(request) ?? request, ...rest)
  }
}
