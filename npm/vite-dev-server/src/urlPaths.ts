/**
 * Build the support file URL matching the URL the browser-side client
 * (client/initCypressTests.js) constructs.
 */
export function getSupportFileRelativeUrl (cypressConfig: Cypress.PluginConfigOptions): string {
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
 * Build the spec URL for Vite's `@fs/` route.
 *
 * The `@fs/` route is mounted at the server root and bypasses the
 * base-aware request middleware, so the URL is intentionally returned
 * without the dev server base prefix — `<base>/@fs/<absolute>` produces a
 * "Failed to load url" pre-transform error in Vite 8, while
 * `/@fs/<absolute>` resolves cleanly.
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
