const Module = require('module')

export const overrideRequire = (requireOverride) => {
  const _load = Module._load

  Module._load = function (...args: any[]) {
    const pkg = args

    if (requireOverride) {
      const mockedDependency = requireOverride(pkg[0], _load)

      if (mockedDependency != null) {
        return mockedDependency
      }
    }

    const ret = _load.apply(this, pkg)

    return ret
  }
}
