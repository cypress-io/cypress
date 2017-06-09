import _ from 'lodash'
import { action } from 'mobx'
import Promise from 'bluebird'

import ipc from '../lib/ipc'
import localData from '../lib/local-data'
import viewStore from '../lib/view-store'
import projectsStore from '../projects/projects-store'
import specsCollection from '../specs/specs-collection'

import { getSpecs } from '../specs/specs-api'

const saveToLocalStorage = () => {
  localData.set('projects', projectsStore.serializeProjects())
}

const loadProjects = (shouldLoad = true) => {
  const inMemoryProjects = projectsStore.projects
  const cachedProjects = localData.get('projects') || []

  if (!inMemoryProjects.length) {
    if (cachedProjects.length) {
      projectsStore.setProjects(cachedProjects)
    } else if (shouldLoad) {
      projectsStore.setLoading(true)
    }
  }

  return ipc.getProjects()
  .then((ipcProjects) => {
    const cacheIndex = _.keyBy(cachedProjects, 'id') // index for quick lookup
    const projects = _.map(ipcProjects, (ipcProject) => {
      return _.extend(ipcProject, cacheIndex[ipcProject.id])
    })
    projectsStore.setProjects(projects)
    projectsStore.setLoading(false)

    return ipc.getProjectStatuses(projects)
  })
  .then((projectsWithStatuses) => {
    projectsStore.updateProjectsWithStatuses(projectsWithStatuses)
    saveToLocalStorage()
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch(projectsStore.setError)
}

// const pollProjects = () => {
//   return setInterval(() => {
//     loadProjects(false)
//   }, 10000)
// }

// const stopPollingProjects = (pollId) => {
//   clearInterval(pollId)
// }

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

        specsCollection.setChosenSpec('')

        ipc.offLaunchBrowser()
      }
    })
  }

  let changeChosenSpec = () => {
    specsCollection.setChosenSpec(spec)
  }

  return closeBrowser()
  .then(changeChosenSpec)
  .then(launchBrowser)
}

const closeBrowser = (project) => {
  specsCollection.setChosenSpec('')

  if (project) {
    project.browserClosed()
  }

  ipc.offLaunchBrowser()

  return ipc.closeBrowser()
}

const closeProject = (project) => {
  // unbind listeners
  ipc.offOpenProject()
  ipc.offGetSpecs()
  ipc.offOnFocusTests()

  return Promise.join(
    closeBrowser(project),
    ipc.closeProject()
  )
}

const openProject = (project) => {
  specsCollection.loading(true)

  const setProjectError = action('project:open:errored', (err) => {
    project.setLoading(false)
    project.setError(err)
  })

  const changeConfig = action('config:changed', (config) => {
    project.id = config.projectId
    project.setOnBoardingConfig(config)
    project.setBrowsers(config.browsers)
    project.setResolvedConfig(config.resolved)
  })

  const open = () => {
    return new Promise((resolve) => {
      resolve = _.once(resolve)

      ipc.onFocusTests(() => {
        viewStore.showProjectSpecs(project)
      })

      ipc.getProjectStatus(project.clientDetails())
      .then((projectDetails) => {
        project.update(projectDetails)
      })
      .catch(ipc.isUnauthed, ipc.handleUnauthed)
      .catch(project.setError)

      ipc.openProject(project.path, (err, config = {}) => {
        if (config.specChanged) {
          return specsCollection.setChosenSpec(config.specChanged)
        }

        project.clearError()

        if (err) {
          return setProjectError(err)
        }

        changeConfig(config)

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

const getRecordKeys = () => {
  return ipc.getRecordKeys()
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  // ignore error, settle for no keys
  .catch(() => [])
}

export default {
  loadProjects,
  // pollProjects,
  // stopPollingProjects,
  openProject,
  reopenProject,
  closeProject,
  addProject,
  removeProject,
  runSpec,
  closeBrowser,
  getRecordKeys,
}
