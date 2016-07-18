import once from 'lodash/once'
import { action } from 'mobx'
import Promise from 'bluebird'

import App from '../lib/app'
import { clearActiveSpec } from '../lib/utils'
import projectsStore from '../projects/projects-store'
import specsCollection from '../specs/specs-collection'

const getProjects = () => {
  projectsStore.loading(true)

  return App.ipc('get:project:paths')
  .then(action('got:projects:paths', (paths) => {
    return projectsStore.setProjects(paths)
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
    .then(() => {
      return project.loading(false)
    })
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
        clearActiveSpec()
        project.browserClosed()
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

const closeBrowser = (projectId) => {
  clearActiveSpec()

  App.ipc('close:browser')

  if (projectId) {
    let project = projectsStore.getProjectById(projectId)
    project.browserClosed()
  }

  return App.ipc.off('launch:browser')
}

const closeProject = (projectId) => {
  closeBrowser(projectId)
  return App.ipc('close:project')
}

const openProject = (project) => {

  const setProjectError = action('project:open:errored', (err) => {
    project.loading(false)
    project.setError(err)
  })

  const changeConfig = (config) => {
    project.setOnBoardingConfig(config)
    project.setBrowsers(config.browsers)
    project.setResolvedConfig(config.resolved)
  }

  const open = () => {
    return new Promise((resolve) => {
      resolve = once(resolve)

      App.ipc("open:project", project.path, (err, data = {}) => {
        project.clearError()

        if (err) {
          return setProjectError(err)
        }

        if (data.config) {
          action('config:changed', changeConfig(data.config))
        }

        if (data.specs) {
          specsCollection.loading(true)
          specsCollection.setSpecs(data.specs)
        }

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
  })
  .catch(setProjectError)
}

export {
  getProjects,
  openProject,
  closeProject,
  addProject,
  runSpec,
  closeBrowser,
}
