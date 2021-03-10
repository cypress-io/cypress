import { PluginsConfigAst } from '../babel/babelTransform'

export interface Template<T = unknown> {
  message: string
  getExampleUrl: ({ componentFolder }: { componentFolder: string }) => string
  recommendedComponentFolder: string
  test(rootPath: string): { success: boolean, payload?: T }
  getPluginsCodeAst: (
    payload: T | null,
    options: { cypressProjectRoot: string },
  ) => PluginsConfigAst
  dependencies: string[]
  printHelper?: () => void
}
