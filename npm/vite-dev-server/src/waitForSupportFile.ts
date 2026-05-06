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
 * Build the spec URL path matching the URL the browser-side client
 * (client/initCypressTests.js) constructs for a spec — `<base>/@fs/<absolute>`.
 * Specs are served via Vite's `@fs/` route so absolute paths outside the
 * project root resolve correctly. Used by devServer.ts to warmupRequest each
 * spec, ensuring its module graph is populated before the iframe imports it.
 */
export function getSpecRelativeUrl (
  spec: { absolute: string },
  cypressConfig: Pick<Cypress.PluginConfigOptions, 'devServerPublicPathRoute' | 'platform'>,
): string {
  const { devServerPublicPathRoute, platform } = cypressConfig
  const devServerPublicPathBase = devServerPublicPathRoute === '' ? '.' : devServerPublicPathRoute

  let absolute = spec.absolute

  if (platform === 'win32') {
    absolute = absolute.replace(/\\/g, '/')
  }

  // Strip leading slash so the @fs/ route receives the path the same way the
  // client constructs it (see client/initCypressTests.js).
  const normalizedAbsolute = absolute.replace(/^\//, '')

  return `${devServerPublicPathBase}/@fs/${normalizedAbsolute}`
}
