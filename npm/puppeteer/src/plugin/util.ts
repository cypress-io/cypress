export const pluginName = '@cypress/puppeteer'

export function pluginError (message: string) {
  return new Error(message)
}
