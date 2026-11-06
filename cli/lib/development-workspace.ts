/**
 * Returns an offset workspace for development, or undefined for the default
 * workspace and other environments; rejects invalid development selectors. The CLI
 * cannot import @packages/config, so keep this aligned with its resolver.
 */
export function resolveDevelopmentCloudWorkspaceNumber (environment: string | undefined, env: NodeJS.ProcessEnv = process.env): number | undefined {
  const cloudWorkspaceNum = env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM
  const useDevelopmentCloudWorkspace = environment === 'development' && cloudWorkspaceNum !== undefined

  if (!useDevelopmentCloudWorkspace) {
    return undefined
  }

  const isValidCloudWorkspace = /^[0-5]$/.test(cloudWorkspaceNum ?? '')

  if (!isValidCloudWorkspace) {
    throw new Error(`CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM must be an integer from 0 to 5; received ${JSON.stringify(cloudWorkspaceNum)}`)
  }

  const isDefaultCloudWorkspace = cloudWorkspaceNum === '0'

  return isDefaultCloudWorkspace ? undefined : Number(cloudWorkspaceNum)
}
