import * as babel from '@babel/core'

export interface Template<T = unknown> {
  message: string
  getExampleUrl: ({ componentFolder }: { componentFolder: string }) => string
  recommendedComponentFolder: string
  test(rootPath: string): { success: boolean, payload?: T }
  getPluginsTransformAst?: () => babel.PluginObj
  getPluginsCodeAst?: () => Record<'Require' | 'ModuleExportsBody', ReturnType<typeof babel.template>>
  getPluginsCode: (
    payload: T | null,
    options: { cypressProjectRoot: string },
  ) => string
  printHelper?: () => void
}
