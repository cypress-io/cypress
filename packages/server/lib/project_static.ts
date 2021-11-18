import Debug from 'debug'
import commitInfo from '@cypress/commit-info'
import _ from 'lodash'

import logger from './logger'
import api from './api'
import cache from './cache'
import user from './user'
import keys from './util/keys'
import * as settings from './util/settings'
import { ProjectBase } from './project-base'
import { getDefaultConfigFilePath } from './project_utils'

const debug = Debug('cypress:server:project_static')

export async function getOrgs () {
  const authToken = await user.ensureAuthToken()

  return api.getOrgs(authToken)
}

export function paths () {
  return cache.getProjectRoots()
}

export async function getPathsAndIds () {
  const projectRoots: string[] = await cache.getProjectRoots()

  // this assumes that the configFile for a cached project is 'cypress.json'
  // https://git.io/JeGyF
  return Promise.all(projectRoots.map(async (projectRoot) => {
    return {
      path: projectRoot,
      id: await settings.id(projectRoot),
    }
  }))
}

export async function getDashboardProjects () {
  const authToken = await user.ensureAuthToken()

  debug('got auth token: %o', { authToken: keys.hide(authToken) })

  return api.getProjects(authToken)
}

export function _mergeDetails (clientProject, project) {
  return _.extend({}, clientProject, project, { state: 'VALID' })
}

export function _mergeState (clientProject, state) {
  return _.extend({}, clientProject, { state })
}

export async function _getProject (clientProject, authToken) {
  debug('get project from api', clientProject.id, clientProject.path)

  try {
    const project = await api.getProject(clientProject.id, authToken)

    debug('got project from api')

    return _mergeDetails(clientProject, project)
  } catch (err: any) {
    debug('failed to get project from api', err.statusCode)
    switch (err.statusCode) {
      case 404:
        // project doesn't exist
        return _mergeState(clientProject, 'INVALID')
      case 403:
        // project exists, but user isn't authorized for it
        return _mergeState(clientProject, 'UNAUTHORIZED')
      default:
        throw err
    }
  }
}

export async function getProjectStatuses (clientProjects: any = []) {
  debug(`get project statuses for ${clientProjects.length} projects`)

  const authToken = await user.ensureAuthToken()

  debug('got auth token: %o', { authToken: keys.hide(authToken) })

  const projects = (await api.getProjects(authToken) || [])

  debug(`got ${projects.length} projects`)
  const projectsIndex = _.keyBy(projects, 'id')

  return Promise.all(_.map(clientProjects, (clientProject) => {
    debug('looking at', clientProject.path)
    // not a CI project, just mark as valid and return
    if (!clientProject.id) {
      debug('no project id')

      return _mergeState(clientProject, 'VALID')
    }

    const project = projectsIndex[clientProject.id]

    if (project) {
      debug('found matching:', project)

      // merge in details for matching project
      return _mergeDetails(clientProject, project)
    }

    debug('did not find matching:', project)

    // project has id, but no matching project found
    // check if it doesn't exist or if user isn't authorized
    return _getProject(clientProject, authToken)
  }))
}

export async function getProjectStatus (clientProject) {
  debug('get project status for client id %s at path %s', clientProject.id, clientProject.path)

  if (!clientProject.id) {
    debug('no project id')

    return Promise.resolve(_mergeState(clientProject, 'VALID'))
  }

  const authToken = await user.ensureAuthToken()

  debug('got auth token: %o', { authToken: keys.hide(authToken) })

  return _getProject(clientProject, authToken)
}

export function remove (path) {
  return cache.removeProject(path)
}

export async function add (path, options) {
  // don't cache a project if a non-default configFile is set
  // https://git.io/JeGyF
  if (settings.configFile(options) !== 'cypress.json') {
    return Promise.resolve({ path })
  }

  try {
    await cache.insertProject(path)
    const id = await getId(path)

    return {
      id,
      path,
    }
  } catch (e) {
    return { path }
  }
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

  await settings.write(projectRoot, attrs, { configFile })

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
