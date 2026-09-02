import Module from 'module'

// `Module._load` is Node internals, so it is absent from the public typings.
const InternalModule = Module as unknown as { _load: (...args: any[]) => any }

export const overrideRequire = (requireOverride) => {
  const _load = InternalModule._load

  InternalModule._load = function (...args: any[]) {
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
