export type SpecFolderOrSpecFile = SpecFile | SpecFolder

type CypressSpec = Cypress.Cypress['spec']

export interface SpecFile extends CypressSpec {
	type: 'file'
  shortName: string
}

export interface SpecFolder {
	type: 'folder'
	shortName: string
	specs: SpecFolderOrSpecFile[]
}

/**
 * Split specs into group by their
 * first level of folder hierarchy
 *
 * @param {Array<{name: string}>} specs
 */
// export function makeSpecHierarchy (specs: { name: string }[]) {
export function makeSpecHierarchy (specs: Cypress.Cypress['spec'][]) {
  // to save the existing folder paths
  const kvpGroups: { [fullPath: string]: SpecFolder } = {}

  return specs.reduce<SpecFolderOrSpecFile[]>((groups, spec) => {
    const pathArray = spec.name.split('/')
    let currentSpecArray: SpecFolderOrSpecFile[] = groups
    let currentPath = ''

    do {
      const pathPart = pathArray.shift() || ''

      currentPath += `/${pathPart}`
      // if we have a file set is as part of the current group
      if (!pathArray.length) {
        currentSpecArray.push({
          ...spec,
          type: 'file',
          shortName: pathPart,
        })
      } else if (pathPart) {
        //if it is a folder find if the next folder exists
        let currentGroup: SpecFolder | undefined = kvpGroups[currentPath]

        if (!currentGroup) {
          //if it does not exist we create it
          currentGroup = {
            type: 'folder',
            shortName: pathPart,
            specs: [],
          }

          kvpGroups[currentPath] = currentGroup
          // and add it to the current set of objects
          currentSpecArray.push(currentGroup)
        }

        currentSpecArray = currentGroup.specs
      }
    } while (pathArray.length)

    return groups
  }, [])
}
