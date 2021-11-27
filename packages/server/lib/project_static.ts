import Debug from 'debug'
import commitInfo from '@cypress/commit-info'
import _ from 'lodash'

import logger from './logger'
import api from './api'
import cache from './cache'
import user from './user'
import * as settings from './util/settings'
import { ProjectBase } from './project-base'
import { getDefaultConfigFilePath } from './project_utils'

const debug = Debug('cypress:server:project_static')

export function paths () {
  return cache.getProjectRoots()
}

export function _mergeDetails (clientProject, project) {
  return _.extend({}, clientProject, project, { state: 'VALID' })
}

export function _mergeState (clientProject, state) {
  return _.extend({}, clientProject, { state })
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

interface ProjectDetails {
  projectName: string
  projectRoot: string
  orgId: string | null
  public: boolean
  configFile: string
}

export async function createCiProject ({ projectRoot, configFile, ...projectDetails }: ProjectDetails) {
  debug('create CI project with projectDetails %o projectRoot %s', projectDetails)

  const authToken = await user.ensureAuthToken()
  const remoteOrigin = await commitInfo.getRemoteOrigin(projectRoot)

  debug('found remote origin at projectRoot %o', {
    remoteOrigin,
    projectRoot,
  })

  const newProject = await api.createProject(projectDetails, remoteOrigin, authToken)

  await writeProjectId({
    configFile,
    projectRoot,
    id: newProject.id,
  })

  return newProject
}
