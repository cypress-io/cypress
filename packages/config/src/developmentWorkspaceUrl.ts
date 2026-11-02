/**
 * Validates the selector for the effective service environment. Returns undefined
 * for non-development services and workspace 1, which uses the default ports and app data.
 */
export function resolveDevelopmentWorkspaceNumber (environment: string | undefined, env: NodeJS.ProcessEnv = process.env): number | undefined {
  const workspaceNum = env.CYPRESS_INTERNAL_WORKSPACE_NUM
  const usesWorkspace = environment === 'development' && workspaceNum !== undefined

  if (!usesWorkspace) {
    return undefined
  }

  const isValidWorkspace = /^[1-6]$/.test(workspaceNum)

  if (!isValidWorkspace) {
    throw new Error(`CYPRESS_INTERNAL_WORKSPACE_NUM must be an integer from 1 to 6; received ${JSON.stringify(workspaceNum)}`)
  }

  const isDefaultWorkspace = workspaceNum === '1'

  return isDefaultWorkspace ? undefined : Number(workspaceNum)
}

/**
 * Offsets a localhost service URL for the selected development workspace, preserving
 * its path, query, and trailing slash. Rejects invalid selectors and out-of-range ports.
 */
export function resolveDevelopmentWorkspaceUrl (url: string, environment: string | undefined, env: NodeJS.ProcessEnv = process.env): string {
  const workspaceNum = resolveDevelopmentWorkspaceNumber(environment, env)
  const hasWorkspace = workspaceNum !== undefined

  if (!hasWorkspace) {
    return url
  }

  const parsed = new URL(url)
  const isLocalhost = parsed.hostname === 'localhost'

  if (!isLocalhost) {
    return url
  }

  const defaultPort = parsed.protocol === 'https:' ? 443 : 80
  const port = Number(parsed.port || defaultPort) + workspaceNum * 10000
  const isValidPort = port <= 65535

  if (!isValidPort) {
    throw new Error(`CYPRESS_INTERNAL_WORKSPACE_NUM=${workspaceNum} produces an invalid localhost port: ${port}`)
  }

  // Keep the input's exact URL spelling; URL serialization can add a trailing slash.
  return url.replace(/^(https?:\/\/localhost)(?::\d+)?(?=\/|$|\?|#)/i, `$1:${port}`)
}
