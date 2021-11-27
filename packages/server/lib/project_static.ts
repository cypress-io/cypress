import cache from './cache'
import { ProjectBase } from './project-base'
import { getDefaultConfigFilePath } from './project_utils'

export function paths () {
  return cache.getProjectRoots()
}

export async function getId (path) {
  const configFile = await getDefaultConfigFilePath(path)

  return new ProjectBase({ projectRoot: path, testingType: 'e2e', options: { configFile } }).getProjectId()
}
