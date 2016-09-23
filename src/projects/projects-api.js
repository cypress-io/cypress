import once from 'lodash/once'
import { action } from 'mobx'
import Promise from 'bluebird'
import { hashHistory } from 'react-router'

import App from '../lib/app'
import projectsStore from '../projects/projects-store'
import specsCollection from '../specs/specs-collection'

const getProjects = () => {
  projectsStore.loading(true)

  return App.ipc('get:projects')
  .then(action('got:projects', (projects) => {

    projectsStore.setProjects(projects)

    return App.ipc('get:projects:statuses', (err, projects = []) => {
      // this might never be called
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

const closeBrowser = (projectId) => {
  specsCollection.setChosenSpec('')

  App.ipc('close:browser')

  if (projectId) {
    let project = projectsStore.getProjectById(projectId)
    project.browserClosed()
  }

  App.ipc.off('close:browser')
  return App.ipc.off('launch:browser')
}

const closeProject = (projectId) => {
  closeBrowser(projectId)

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

  const changeConfig = (config) => {
    project.setOnBoardingConfig(config)
    project.setBrowsers(config.browsers)
    project.setResolvedConfig(config.resolved)
  }

  const open = () => {
    return new Promise((resolve) => {
      resolve = once(resolve)

      App.ipc("on:focus:tests", () => {
        hashHistory.push(`projects/${project.id}/specs`)
      })

      App.ipc("open:project", project.path, (err, config = {}) => {
        if (config.specChanged) {
          return specsCollection.setChosenSpec(config.specChanged)
        }

        project.clearError()

        if (err) {
          return setProjectError(err)
        }

        action('config:changed', changeConfig(config))

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

    App.ipc('get:specs', (err, specs = []) => {
      if (err) {
        return setProjectError(err)
      }

      specsCollection.setSpecs(specs)

    })

    return null
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
