/**
 * Build the support file path matching the URL the browser-side client
 * (client/initCypressTests.js) constructs. Used by devServer.ts to call
 * Vite's warmupRequest with the same path the iframe will dynamically
 * import.
 */
export function getSupportFileRelativePath (cypressConfig: Cypress.PluginConfigOptions): string {
  const { projectRoot, supportFile, devServerPublicPathRoute } = cypressConfig

  if (!supportFile) {
    return ''
  }

  let supportRelativeToProjectRoot = supportFile.replace(projectRoot, '')

  if (cypressConfig.platform === 'win32') {
    const platformProjectRoot = projectRoot.replace(/\//g, '\\')

    supportRelativeToProjectRoot = supportFile.replace(platformProjectRoot, '')
    supportRelativeToProjectRoot = supportRelativeToProjectRoot.replace(/\\/g, '/')
  }

  const devServerPublicPathBase = devServerPublicPathRoute === '' ? '.' : devServerPublicPathRoute

  return `${devServerPublicPathBase}${supportRelativeToProjectRoot}`
}

/**
 * Build the spec URL path passed to Vite's `server.warmupRequest()` so the
 * spec's module graph is populated before the iframe dynamically imports it.
 *
 * Vite's `@fs/` route (which lets absolute paths outside the project root
 * resolve) is mounted at the server root and does not have the dev server
 * base prefix applied — passing `<base>/@fs/<absolute>` to warmupRequest
 * yields a "Failed to load url" pre-transform error in Vite 8, while
 * `/@fs/<absolute>` resolves cleanly. This intentionally diverges from the
 * client-side URL the browser constructs (which does include the base, since
 * the browser fetches over HTTP through the base-aware middleware).
 */
export function getSpecRelativeUrl (
  spec: { absolute: string },
  cypressConfig: Pick<Cypress.PluginConfigOptions, 'platform'>,
): string {
  let absolute = spec.absolute

  if (cypressConfig.platform === 'win32') {
    absolute = absolute.replace(/\\/g, '/')
  }

  // Strip leading slash so the @fs/ route receives the path the same way the
  // client constructs it (see client/initCypressTests.js).
  const normalizedAbsolute = absolute.replace(/^\//, '')

  return `/@fs/${normalizedAbsolute}`
}
