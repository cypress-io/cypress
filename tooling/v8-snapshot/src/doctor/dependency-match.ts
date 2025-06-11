/**
 * Checks if a dependency matches a force no rewrite entry
 * @param dependency - The dependency to check
 * @param forceNorewrite - The force no rewrite entry
 * @returns true if the dependency matches the force no rewrite entry, false otherwise
 */
export const doesDependencyMatchForceNorewriteEntry = (dependency: string, forceNorewrite: string) => {
  // The force no rewrite file follows a convention where we try
  // and match all possible node_modules paths if the force no
  // rewrite entry starts with "*/". If it does not
  // start with "*" then it is an exact match.
  return (forceNorewrite.startsWith('*/') && dependency.endsWith(forceNorewrite.slice(2))) || dependency === forceNorewrite
}
