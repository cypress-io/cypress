// The CLI cannot import @packages/config; keep this aligned with its workspace resolver.
export function resolveDevelopmentWorkspaceNumber (environment: string | undefined, env: NodeJS.ProcessEnv = process.env): number | undefined {
  const workspaceNum = env.CYPRESS_INTERNAL_WORKSPACE_NUM
  const useDevelopmentWorkspace = environment === 'development' && Boolean(workspaceNum)

  if (!useDevelopmentWorkspace) {
    return undefined
  }

  const isValidWorkspace = /^[0-6]$/.test(workspaceNum ?? '')

  if (!isValidWorkspace) {
    throw new Error(`CYPRESS_INTERNAL_WORKSPACE_NUM must be an integer from 0 to 6; received ${JSON.stringify(workspaceNum)}`)
  }

  const isDefaultWorkspace = workspaceNum === '0'

  return isDefaultWorkspace ? undefined : Number(workspaceNum)
}
