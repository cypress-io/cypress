import _ from 'lodash'
import Promise from 'bluebird'

import appStore from '../lib/app-store'
import viewStore from '../lib/view-store'
import projectsStore from './projects-store'
import specsStore from '../specs/specs-store'

import ipc from '../lib/ipc'
import localData from '../lib/local-data'
import { getSpecs } from '../specs/specs-api'
import Project from '../project/project-model'

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
    project.update(details)
    saveToLocalStorage()
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch((err) => {
    project.setError(err)
  })
  .return(project)
}

const listenForBrowserClose = (project) => {
  ipc.onBrowserClose(() => {
    specsStore.setChosenSpec(null)

    appStore.setUiBlocked(true)
    project.setBrowserState(Project.BROWSER_CLOSING)

    ipc.awaitBrowserClose()
    .catch((err) => {
      project.setError(err)
    })
    .finally(() => {
      project.setBrowserState(Project.BROWSER_CLOSED)
      appStore.setUiBlocked(false)
      ipc.offOnBrowserClose()
    })
  })
}

const launchBrowser = (project, spec, browser) => {
  appStore.setUiBlocked(true)
  project.setBrowserState(Project.BROWSER_OPENING)

  listenForBrowserClose(project)

  return ipc.launchBrowser({ browser, spec })
  .then(() => {
    project.setBrowserState(Project.BROWSER_OPEN)
  })
  .catch((err) => {
    ipc.offBrowserClosed()
    project.setBrowserState(Project.BROWSER_CLOSED)

    project.setError(err)
  })
  .finally(() => {
    appStore.setUiBlocked(false)
  })
}

const runSpec = (project, spec, browser) => {
  return closeBrowser(project)
  .then(() => {
    specsStore.setChosenSpec(spec)
    project.setChosenBrowser(browser)

    return launchBrowser(project, spec.file, browser)
  })
}

const closeBrowser = (project) => {
  ipc.offOnBrowserClose()

  specsStore.setChosenSpec(null)

  if (project.isBrowserState(Project.BROWSER_CLOSING, Project.BROWSER_CLOSED)) {
    return Promise.resolve()
  }

  appStore.setUiBlocked(true)
  project.setBrowserState(Project.BROWSER_CLOSING)

  return ipc.closeBrowser()
  .catch((err) => {
    project.setError(err)
  })
  .finally(() => {
    project.setBrowserState(Project.BROWSER_CLOSED)
    appStore.setUiBlocked(false)
  })
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

  return closeBrowser(project)
  .then(() => {
    appStore.setUiBlocked(true)
    project.setClosing(true)

    return ipc.closeProject()
  })
  .finally(() => {
    project.setClosing(false)
    appStore.setUiBlocked(false)
  })
}

const openProject = (project) => {
  const setProjectError = (err) => {
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
    project.update({ name: config.projectName })
    project.setOnBoardingConfig(config)
    project.setBrowsers(config.browsers)
    project.setResolvedConfig(config.resolved)
  }

  ipc.onFocusTests(() => {
    viewStore.showProjectSpecs(project)
  })

  ipc.onSpecChanged((__, relativeSpecPath) => {
    specsStore.setChosenSpecByRelativePath(relativeSpecPath)
  })

  ipc.onConfigChanged(() => {
    reopenProject(project)
  })

  ipc.onProjectError((__, error) => {
    project.setError(error)
  })

  ipc.onProjectWarning((__, warning) => {
    project.setWarning(warning)
  })

  appStore.setUiBlocked(true)
  project.setLoading(true)

  return ipc.openProject(project.path)
  .then((config = {}) => {
    updateConfig(config)
    const projectIdAndPath = { id: config.projectId, path: project.path }

    specsStore.setFilter(projectIdAndPath, localData.get(specsStore.getSpecsFilterId(projectIdAndPath)))
    project.setLoading(false)
    appStore.setUiBlocked(false)
    specsStore.setLoading(true)

    getSpecs(setProjectError)

    projectPollingId = setInterval(updateProjectStatus, 10000)

    return updateProjectStatus()
  })
  .catch(setProjectError)
  .finally(() => {
    project.setLoading(false)
    appStore.setUiBlocked(false)
  })
}

const reopenProject = (project) => {
  project.clearError()
  project.clearWarning()

  return closeProject(project)
  .then(() => {
    return openProject(project)
  })
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
  .catch(() => {
    return []
  })
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
