/**
 * Wait until the Vite dev server can serve the support file (HTTP 200).
 * This makes the "dev server ready" signal deterministic and avoids the race
 * where the iframe loads before the server has finished serving the module.
 */

const DEFAULT_MAX_ATTEMPTS = 30
const DEFAULT_DELAY_MS = 200

interface WaitUntilUrlReadyOptions {
  maxAttempts?: number
  delayMs?: number
}

/**
 * Build the support file path (same logic as client/initCypressTests.js)
 * so we poll the same URL the browser will request.
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
 * Poll a URL until it returns a 2xx response or we exceed maxAttempts.
 */
export async function waitUntilUrlReady (
  url: string,
  options: WaitUntilUrlReadyOptions = {},
): Promise<void> {
  const { maxAttempts = DEFAULT_MAX_ATTEMPTS, delayMs = DEFAULT_DELAY_MS } = options

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url)

      if (res.ok) {
        return
      }

      lastError = new Error(`Support file URL returned ${res.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw new Error(
    `Vite dev server did not become ready in time (${maxAttempts} attempts). ${lastError?.message ?? ''}`,
  )
}
