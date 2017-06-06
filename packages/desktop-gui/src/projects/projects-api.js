import once from 'lodash/once'
import { action } from 'mobx'
import Promise from 'bluebird'

import ipc from '../lib/ipc'
import viewStore from '../lib/view-store'
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
    project.setLoading(true)

    return Promise.all([
      ipc.addProject(path),
      Promise.delay(750),
    ])
    .spread(action('project:added', (clientProjectDetails) => {
      project.setLoading(false)

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
      resolve = once(resolve)

      ipc.onFocusTests(() => {
        viewStore.showProjectSpecs(project)
      })

      ipc.getProjectStatus(project.clientDetails())
      .then((projectDetails) => {
        project.update(projectDetails)
      })
      .catch(ipc.isUnauthed, ipc.handleUnauthed)

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

const getRecordKeys = () => {
  return ipc.getRecordKeys()
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
  // ignore error, settle for no keys
  .catch(() => [])
}

export default {
  getProjects,
  pollProjects,
  stopPollingProjects,
  openProject,
  reopenProject,
  closeProject,
  addProject,
  runSpec,
  closeBrowser,
  getRecordKeys,
}
