export interface ReadPropertyFromCypressConfigAstOptions {
  configFilePath: string
}

/**
 * If we want to read off a property from the Cypress config,
 * without executing the file. The primary use case for this is
 * for finding the `projectId` when it's defined in the config file.
 */
export function readPropertyFromCypressConfigAST (
  options: ReadPropertyFromCypressConfigAstOptions,
) {
  //
}
