import Module from 'module'

/**
 * requireScript, does just that, requires the passed in script as if it was a module.
 * @param script - string
 * @returns exports
 */
export const requireScript = <T>(script: string): T => {
  const mod = new Module('id', module)

  mod.filename = ''
  // _compile is a private method
  // @ts-expect-error
  mod._compile(script, mod.filename)

  if (module.children) {
    const index = module.children.indexOf(mod)

    if (index !== -1) {
      module.children.splice(index, 1)
    }
  }

  return mod.exports as T
}
