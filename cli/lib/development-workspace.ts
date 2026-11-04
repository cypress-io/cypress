/**
 * Returns an offset workspace for development, or undefined for the default
 * workspace and other environments; rejects invalid development selectors. The CLI
 * cannot import @packages/config, so keep this aligned with its resolver.
 */
export function resolveDevelopmentCloudWorkspaceNumber (environment: string | undefined, env: NodeJS.ProcessEnv = process.env): number | undefined {
  const workspaceNum = env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM
  const useDevelopmentWorkspace = environment === 'development' && workspaceNum !== undefined

  if (!useDevelopmentWorkspace) {
    return undefined
  }

  const isValidWorkspace = /^[0-5]$/.test(workspaceNum ?? '')

  if (!isValidWorkspace) {
    throw new Error(`CYPRESS_INTERNAL_WORKSPACE_NUM must be an integer from 0 to 5; received ${JSON.stringify(workspaceNum)}`)
  }

  const isDefaultWorkspace = workspaceNum === '0'

  return isDefaultWorkspace ? undefined : Number(workspaceNum)
}
