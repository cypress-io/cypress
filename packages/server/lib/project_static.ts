import _ from 'lodash'

import logger from './logger'
import cache from './cache'
import * as settings from './util/settings'
import { ProjectBase } from './project-base'
import { getDefaultConfigFilePath } from './project_utils'

export function paths () {
  return cache.getProjectRoots()
}

export async function getId (path) {
  const configFile = await getDefaultConfigFilePath(path)

  return new ProjectBase({ projectRoot: path, testingType: 'e2e', options: { configFile } }).getProjectId()
}

interface ProjectIdOptions{
  id: string
  projectRoot: string
  configFile: string
}

export async function writeProjectId ({ id, projectRoot, configFile }: ProjectIdOptions) {
  const attrs = { projectId: id }

  logger.info('Writing Project ID', _.clone(attrs))

  // TODO: We need to set this
  // this.generatedProjectIdTimestamp = new Date()

  await settings.writeOnly(projectRoot, attrs, { configFile })

  return id
}
