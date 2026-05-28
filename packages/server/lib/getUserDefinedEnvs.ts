/**
 * Get the user defined environment variables used on behalf of cy.env(). This is invoked by the privileged commands manager
 * to return the requested environment variables to cy.env() in a privileged context only available to the spec file.
 * @param requestedKeys - The keys to get from the user defined environment variables
 * @param userDefinedEnvironmentVariables - The user defined environment variables
 * @returns The requested user defined environment variables
 */
export const getUserDefinedEnvironmentVariables = ({ requestedKeys, userDefinedEnvironmentVariables }: { requestedKeys: string[], userDefinedEnvironmentVariables: Record<string, string> }) => {
  const envMap = new Map<string, string>()

  requestedKeys.forEach((key) => {
    envMap.set(key, userDefinedEnvironmentVariables[key])
  })

  // return the map as an object
  return Object.fromEntries(envMap)
}
