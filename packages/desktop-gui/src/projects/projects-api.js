import _ from 'lodash'
import Promise from 'bluebird'

import ipc from '../lib/ipc'
import localData from '../lib/local-data'
import viewStore from '../lib/view-store'
import projectsStore from '../projects/projects-store'
import specsStore from '../specs/specs-store'

import { getSpecs } from '../specs/specs-api'

const saveToLocalStorage = () => {
  localData.set('projects', projectsStore.serializeProjects())
}

const loadProjects = (shouldLoad = true) => {
  if (!projectsStore.projects.length && shouldLoad) {
    projectsStore.setLoading(true)
  }

  return ipc.getProjects()
  .then((ipcProjects) => {
    // extend the projects with data cached in local storage
    const cacheIndex = _.keyBy(localData.get('projects'), 'path')
    const projects = _.map(ipcProjects, (ipcProject) => {
      return _.extend(ipcProject, cacheIndex[ipcProject.path])
    })

    projectsStore.setProjects(projects)
    projectsStore.setLoading(false)
    saveToLocalStorage()

    return ipc.getProjectStatuses(projects)
  })
  .then((projectsWithStatuses) => {
    projectsStore.updateProjectsWithStatuses(projectsWithStatuses)
    saveToLocalStorage()
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch(projectsStore.setError)
}

const addProject = (path) => {
  const project = projectsStore.addProject(path)
  project.setLoading(true)

  return ipc.addProject(path)
  .then((details) => {
    project.setLoading(false)
    project.update(details)
    saveToLocalStorage()
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch(project.setError)
  .return(project)
}

const runSpec = (project, spec, browser) => {
  project.setChosenBrowserByName(browser)

  let launchBrowser = () => {
    project.browserOpening()

    ipc.launchBrowser({ browser, spec }, (err, data = {}) => {
      if (data.browserOpened) {
        project.browserOpened()
      }

      if (data.browserClosed) {
        project.browserClosed()

        specsStore.setChosenSpec('')

        ipc.offLaunchBrowser()
      }
    })
  }

  let changeChosenSpec = () => {
    specsStore.setChosenSpec(spec)
  }

  return closeBrowser()
  .then(changeChosenSpec)
  .then(launchBrowser)
}

const closeBrowser = (project) => {
  specsStore.setChosenSpec('')

  if (project) {
    project.browserClosed()
  }

  ipc.offLaunchBrowser()

  return ipc.closeBrowser()
}

let projectPollingId

const closeProject = (project) => {
  clearInterval(projectPollingId)
  ipc.offOpenProject()
  ipc.offGetSpecs()
  ipc.offOnFocusTests()

  return Promise.join(
    closeBrowser(project),
    ipc.closeProject()
  )
}

const openProject = (project) => {
  specsStore.loading(true)

  const setProjectError = (err) => {
    project.setLoading(false)
    project.setError(err)
  }

  const updateProjectStatus = () => {
    ipc.getProjectStatus(project.clientDetails())
    .then((projectDetails) => {
      project.update(projectDetails)
    })
    .catch(ipc.isUnauthed, ipc.handleUnauthed)
    .catch(project.setError)
  }

  const updateConfig = (config) => {
    project.update({ id: config.projectId })
    project.setOnBoardingConfig(config)
    project.setBrowsers(config.browsers)
    project.setResolvedConfig(config.resolved)
  }

  const open = () => {
    return new Promise((resolve) => {
      resolve = _.once(resolve)

      ipc.onFocusTests(() => {
        viewStore.showProjectSpecs(project)
      })

      ipc.openProject(project.path, (err, config = {}) => {
        if (config.specChanged) {
          return specsStore.setChosenSpec(config.specChanged)
        }

        project.clearError()

        if (err) {
          return setProjectError(err)
        }

        updateConfig(config)

         // this needs to be after updateConfig so that the project's id is set
        updateProjectStatus()
        projectPollingId = setInterval(updateProjectStatus, 10000)

        resolve()
      })
    })
  }

  return Promise.all([
    open(),
    Promise.delay(500),
  ])
  .then(() => {
    project.setLoading(false)

    getSpecs(setProjectError)

    return null
  })
  .catch(setProjectError)
}

const reopenProject = (project) => {
  return closeProject(project)
  .then(() => openProject(project))
}

const removeProject = (project) => {
  ipc.removeProject(project.path)
  projectsStore.removeProject(project)
  saveToLocalStorage()
}

const updateProject = (project, projectDetails) => {
  project.update(projectDetails)
  saveToLocalStorage()
}

const getRecordKeys = () => {
  return ipc.getRecordKeys()
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  // ignore error, settle for no keys
  .catch(() => [])
}

export default {
  loadProjects,
  openProject,
  reopenProject,
  closeProject,
  addProject,
  removeProject,
  updateProject,
  runSpec,
  closeBrowser,
  getRecordKeys,
}
