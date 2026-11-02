export function resolveDevelopmentWorkspaceNumber (environment: string | undefined, env: NodeJS.ProcessEnv = process.env): number | undefined {
  const workspaceNum = env.CYPRESS_INTERNAL_WORKSPACE_NUM
  const usesWorkspace = environment === 'development' && workspaceNum !== undefined && workspaceNum !== ''

  if (!usesWorkspace) {
    return undefined
  }

  const isValidWorkspace = /^[0-6]$/.test(workspaceNum)

  if (!isValidWorkspace) {
    throw new Error(`CYPRESS_INTERNAL_WORKSPACE_NUM must be an integer from 0 to 6; received ${JSON.stringify(workspaceNum)}`)
  }

  const isDefaultWorkspace = workspaceNum === '0'

  return isDefaultWorkspace ? undefined : Number(workspaceNum)
}

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

  return url.replace(/^(https?:\/\/localhost)(?::\d+)?(?=\/|$|\?|#)/i, `$1:${port}`)
}
