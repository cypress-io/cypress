import once from 'lodash/once'
import { action } from 'mobx'
import Promise from 'bluebird'
import { hashHistory } from 'react-router'

import ipc from '../lib/ipc'
import projectsStore from '../projects/projects-store'
import specsCollection from '../specs/specs-collection'

import { getSpecs } from '../specs/specs-api'

const getProjects = (shouldLoad = true) => {
  if (shouldLoad) {
    projectsStore.loading(true)
  }

  return ipc.getProjects()
  .then(action('got:projects', (projects) => {
    projectsStore.setProjects(projects)

    return ipc.getProjectStatuses(projects)
    .then((projects = []) => {
      projectsStore.setProjectStatuses(projects)
    })
  }))
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
}

const pollProjects = () => {
  return setInterval(() => {
    getProjects(false)
  }, 10000)
}

const stopPollingProjects = (pollId) => {
  clearInterval(pollId)
}

const addProject = () => {
  let project
  return ipc.showDirectoryDialog()
  .then(action('directory:dialog:closed', (path) => {
     // if the user cancelled the dialog selection
     // path will be undefined
    if (!path) return

    // initially set our project to be loading state
    project = projectsStore.addProject(path)
    project.loading(true)

    return Promise.all([
      ipc.addProject(path),
      Promise.delay(750),
    ])
    .spread(action('project:added', (clientProjectDetails) => {
      project.loading(false)

      if (clientProjectDetails.id != null) {
        return ipc.getProjectStatus(clientProjectDetails)
        .then(action('project:status:received', (projectDetails) => {
          project.update(projectDetails)
        }))
        .catch(ipc.isUnauthed, ipc.handleUnauthed)
      }
    }))
  }))
  .catch((err) => {
    projectsStore.setError(err.message)
  })
}

const runSpec = (project, spec, browser, url) => {
  project.setChosenBrowserByName(browser)

  let launchBrowser = () => {
    project.browserOpening()

    ipc.launchBrowser({ browser, url, spec }, (err, data = {}) => {
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

  return ipc.closeBrowser()
  .then(launchBrowser)
}

const closeBrowser = (clientId) => {
  specsCollection.setChosenSpec('')

  if (clientId) {
    let project = projectsStore.getProjectByClientId(clientId)
    project.browserClosed()
  }

  ipc.offLaunchBrowser()

  return ipc.closeBrowser()
}

const closeProject = (clientId) => {
  closeBrowser(clientId)

  // unbind listeners
  ipc.offOpenProject()
  ipc.offGetSpecs()
  ipc.offOnFocusTests()

  ipc.closeProject()
}

const openProject = (project) => {
  specsCollection.loading(true)

  const setProjectError = action('project:open:errored', (err) => {
    project.loading(false)
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
      resolve = once(resolve)

      ipc.onFocusTests(() => {
        hashHistory.push(`projects/${project.clientId}/specs`)
      })

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
    project.loading(false)

    getSpecs(setProjectError)

    return null
  })
  .catch(setProjectError)
}

const getRecordKeys = () => {
  return ipc.getRecordKeys()
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  // ignore error, settle for no keys
  .catch(() => [])
}

export {
  getProjects,
  pollProjects,
  stopPollingProjects,
  openProject,
  closeProject,
  addProject,
  runSpec,
  closeBrowser,
  getRecordKeys,
}
