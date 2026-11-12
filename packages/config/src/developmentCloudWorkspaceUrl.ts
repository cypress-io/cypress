/**
 * Validates the selector for the effective service environment. Returns undefined
 * for non-development services and workspace 0, which uses the default ports and app data.
 */
export function resolveDevelopmentCloudWorkspaceNumber (environment: string | undefined, env: NodeJS.ProcessEnv = process.env): number | undefined {
  const cloudWorkspaceNum = env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM
  const usesCloudWorkspace = environment === 'development' && cloudWorkspaceNum !== undefined

  if (!usesCloudWorkspace) {
    return undefined
  }

  const isValidCloudWorkspace = /^[0-5]$/.test(cloudWorkspaceNum)

  if (!isValidCloudWorkspace) {
    throw new Error(`CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM must be an integer from 0 to 5; received ${JSON.stringify(cloudWorkspaceNum)}`)
  }

  const isDefaultCloudWorkspace = cloudWorkspaceNum === '0'

  return isDefaultCloudWorkspace ? undefined : Number(cloudWorkspaceNum)
}

/**
 * Offsets a localhost service URL for the selected development workspace, preserving
 * its path, query, and trailing slash. Rejects invalid selectors and out-of-range ports.
 */
export function resolveDevelopmentCloudWorkspaceUrl (url: string, environment: string | undefined, env: NodeJS.ProcessEnv = process.env): string {
  const cloudWorkspaceNum = resolveDevelopmentCloudWorkspaceNumber(environment, env)
  const hasCloudWorkspace = cloudWorkspaceNum !== undefined

  if (!hasCloudWorkspace) {
    return url
  }

  const parsed = new URL(url)
  const isLocalhost = parsed.hostname === 'localhost'

  if (!isLocalhost) {
    return url
  }

  const defaultPort = parsed.protocol === 'https:' ? 443 : 80
  const port = Number(parsed.port || defaultPort) + cloudWorkspaceNum * 10000
  const isValidPort = port <= 65535

  if (!isValidPort) {
    throw new Error(`CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM=${cloudWorkspaceNum} produces an invalid localhost port: ${port}`)
  }

  // Keep the input's exact URL spelling; URL serialization can add a trailing slash.
  return url.replace(/^(https?:\/\/localhost)(?::\d+)?(?=\/|$|\?|#)/i, `$1:${port}`)
}
