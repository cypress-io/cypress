import Module from 'module'

/**
 * requireScript, does just that, requires the passed in script as if it was a module.
 * @param script - string
 * @returns exports
 */
export const requireScript = (script: string) => {
  const mod = new Module('id', module)

  mod.filename = ''
  // _compile is a private method
  // @ts-expect-error
  mod._compile(script, mod.filename)

  module.children.splice(module.children.indexOf(mod), 1)

  return mod.exports
}
