import { action } from 'mobx'
import App from '../lib/app'
import projectsStore from '../projects/projects-store'
import Promise from 'bluebird'

const getProjects = () => {
  projectsStore.loading(true)

  return App.ipc('get:project:paths')
  .then(action('got:projects:paths', (paths) => {
    projectsStore.setProjects(paths)
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
  let launchBrowser = () => {
    project.setChosenBrowserByName(browser)
    project.browserOpening()

    return App.ipc('launch:browser', { browser, url, spec }, (err, data = {}) => {
      if (data.browserOpened) {
        project.browserOpened()
      }

      if (data.browserClosed) {
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
  App.ipc('close:browser')
  if (projectId) {
    let project = projectsStore.getProjectById(projectId)
    project.browserClosed()
  }
  App.ipc.off('launch:browser')
}

const closeProject = (projectId) => {
  closeBrowser(projectId)
  return App.ipc('close:project')
}

const openProject = (project) => {
  project.loading(true)

  // delay opening the project so
  // we give the UI some time to render
  // and not block due to sync require's
  // in the main process
  return Promise.delay(100)
  .then(() => {
    return Promise.all([
      App.ipc('open:project', project.path),
      Promise.delay(500),
    ])
  })
  .spread(action('project:opened', (config) => {
    project.setOnBoardingConfig(config)
    project.setBrowsers(config.browsers)
    project.setResolvedConfig(config.resolved)
  }))
  .then(() => {
    project.loading(false)
    // create a promise which listens for
    // project settings change events
    // and updates our project model
    const listenToProjectSettingsChange = () => {
      return App.ipc('on:project:settings:change')
      .then(action('project:config:changed', (data = {}) => {
        project.reset()
        project.setBrowsers(data.config.browsers)

        // if we had an open browser then launch it again!
        if (data.browser) {
          action('launch:browser', runSpec(project, data.browser))
        }

        // recursively listen for more change events!
        return listenToProjectSettingsChange()
      }))
    }
    return listenToProjectSettingsChange()
  })
  .catch(action('project:open:errored', (err) => {
    project.loading(false)
    project.setError(err)
  }))
}

export {
  getProjects,
  openProject,
  closeProject,
  addProject,
  runSpec,
  closeBrowser,
}
