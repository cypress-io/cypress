import { action } from 'mobx'
import App from '../lib/app'
import projectsStore from '../projects/projects-store'

const getProjects = () => {
  App.ipc('get:project:paths').then(action('get:project:paths', (projectPaths) => {
    projectsStore.setProjects(projectPaths)
  }))
}

const launchBrowser = (project, browser, url) => {
  project.setChosenBrowserByName(browser)
  // project.browserOpening()

  App.ipc('launch:browser', { browser, url }, (err, data = {}) => {
    if (data.browserOpened) {
      // project.browserOpened()
    }

    if (data.browserClosed) {
      App.ipc.off('launch:browser')
      // project.browserClosed()
    }
  })
}

const openProject = (project) => {
  projectsStore.setChosen(project)
  App.ipc('open:project', project.path)
  .spread((config) => {
    // this will set the available browsers on the project
    project.setBrowsers(config.browsers)
  })
  .then(() => {
    // create a promise which listens for
    // project settings change events
    // and updates our project model
    const listenToProjectSettingsChange = () => {
      App.ipc('on:project:settings:change')
      .then((data = {}) => {
        project.reset()
        project.setBrowsers(data.config.browsers)

        // if we had an open browser then launch it again!
        if (data.browser) {
          launchBrowser(project, data.browser)
        }

        // recursively listen for more
        // change events!
        listenToProjectSettingsChange()
      })
    }
    listenToProjectSettingsChange()
  })
  .catch((err) => {
    err
    // project.setError(err)
  })
}

export {
  getProjects,
  openProject,
}
