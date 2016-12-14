import once from 'lodash/once'
import { action } from 'mobx'
import Promise from 'bluebird'
import { hashHistory } from 'react-router'

import App from '../lib/app'
import projectsStore from '../projects/projects-store'
import specsCollection from '../specs/specs-collection'

import { getSpecs } from '../specs/specs-api'

const getProjects = () => {
  projectsStore.loading(true)

  return App.ipc('get:projects')
  .then(action('got:projects', (projects) => {
    projectsStore.setProjects(projects)

    return App.ipc('get:project:statuses', projects)
    .then((projects = []) => {
      projectsStore.setProjectStatuses(projects)
    })
  }))
}

const addProject = () => {
  let project
  return App.ipc('show:directory:dialog')
  .then(action('directory:dialog:closed', (path) => {
     // if the user cancelled the dialog selection
     // path will be undefined
    if (!path) return

    // initially set our project to be loading state
    project = projectsStore.addProject(path)
    project.loading(true)

    return Promise.all([
      App.ipc('add:project', path),
      Promise.delay(750),
    ])
    .spread(action('project:added', (clientProjectDetails) => {
      project.loading(false)

      if (clientProjectDetails.id != null) {
        return App.ipc('get:project:status', clientProjectDetails)
        .then(action('project:status:received', (projectDetails) => {
          project.update(projectDetails)
        }))
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

    return App.ipc('launch:browser', { browser, url, spec }, (err, data = {}) => {
      if (data.browserOpened) {
        project.browserOpened()

      }

      if (data.browserClosed) {
        project.browserClosed()

        specsCollection.setChosenSpec('')

        return App.ipc.off('launch:browser')
      }
    })
  }

  return App.ipc('get:open:browsers')
  .then((browsers = []) => {
    if (browsers.length) {
      return App.ipc('change:browser:spec', { spec })
    } else {
      return launchBrowser()
    }
  })

}

const closeBrowser = (clientId) => {
  specsCollection.setChosenSpec('')

  App.ipc('close:browser')

  if (clientId) {
    let project = projectsStore.getProjectByClientId(clientId)
    project.browserClosed()
  }

  App.ipc.off('close:browser')
  return App.ipc.off('launch:browser')
}

const closeProject = (clientId) => {
  closeBrowser(clientId)

  // unbind listeners
  App.ipc.off('open:project')
  App.ipc.off('get:specs')
  App.ipc.off('on:focus:tests')

  App.ipc('close:project')
  App.ipc.off('close:project')
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

      App.ipc("on:focus:tests", () => {
        hashHistory.push(`projects/${project.clientId}/specs`)
      })

      App.ipc("open:project", project.path, (err, config = {}) => {
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

const getCiKeys = () => {
  return App.ipc('get:ci:keys')
  // ignore error, settle for no ci keys
  .catch(() => [])
}

export {
  getProjects,
  openProject,
  closeProject,
  addProject,
  runSpec,
  closeBrowser,
  getCiKeys,
}
