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
    return null
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch({ isApiError: true }, () => {}) // ignore api errors
  .catch((err) => {
    projectsStore.setError(err)
  })
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
  .catch((err) => {
    project.setError(err)
  })
  .return(project)
}

const runSpec = (project, spec, browser) => {
  project.setChosenBrowserByName(browser)

  const launchBrowser = () => {
    project.browserOpening()

    ipc.launchBrowser({ browser, spec }, (err, data = {}) => {
      if (data.browserOpened) {
        project.browserOpened()
      }

      if (data.browserClosed) {
        project.browserClosed()

        specsStore.setChosenSpec(null)

        ipc.offLaunchBrowser()
      }
    })
  }

  const changeChosenSpec = () => {
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
  ipc.offOnSpecChanged()
  ipc.offOnProjectWarning()
  ipc.offOnConfigChanged()

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
    return ipc.getProjectStatus(project.clientDetails())
    .then((projectDetails) => {
      project.update(projectDetails)
    })
    .catch(ipc.isUnauthed, ipc.handleUnauthed)
    .catch((err) => {
      project.setApiError(err)
    })
  }

  const updateConfig = (config) => {
    project.update({ id: config.projectId })
    project.setOnBoardingConfig(config)
    project.setBrowsers(config.browsers)
    project.setResolvedConfig(config.resolved)
  }

  ipc.onFocusTests(() => {
    viewStore.showProjectSpecs(project)
  })

  ipc.onSpecChanged((__, spec) => {
    specsStore.setChosenSpec(spec)
  })

  ipc.onConfigChanged(() => {
    reopenProject(project)
  })

  ipc.onProjectWarning((__, warning) => {
    project.setWarning(warning)
  })

  return ipc.openProject(project.path)
  .then((config = {}) => {
    updateConfig(config)
    project.setLoading(false)
    getSpecs(setProjectError)

    projectPollingId = setInterval(updateProjectStatus, 10000)
    return updateProjectStatus()
  })
  .catch(setProjectError)
}

const reopenProject = (project) => {
  project.clearError()
  project.clearWarning()
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
