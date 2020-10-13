export interface Template<T = unknown> {
  message: string
  getExampleUrl: ({ componentFolder }: { componentFolder: string }) => string
  recommendedComponentFolder: string
  test(rootPath: string): { success: boolean; payload?: T }
  getPluginsCode: (
    payload: T | null,
    options: { cypressProjectRoot: string },
  ) => string
  printHelper?: () => void
}
