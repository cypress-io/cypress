const _ = require('lodash')
const Promise = require('bluebird')
const { globalPubSub } = require('@packages/data-context')

const { fs } = require('./util/fs')
const appData = require('./util/app_data')
const FileUtil = require('./util/file')

const fileUtil = new FileUtil({
  path: appData.path('cache'),
})

globalPubSub.on('test:cleanup', () => {
  fileUtil.__resetForTest()
})

const convertProjectsToArray = function (obj) {
  // if our project structure is not
  // an array then its legacy and we
  // need to convert it
  if (!_.isArray(obj.PROJECTS)) {
    obj.PROJECTS = _.chain(obj.PROJECTS).values().map('PATH').compact().value()

    return obj
  }
}

const renameSessionToken = function (obj) {
  let st

  if (obj.USER && (st = obj.USER.session_token)) {
    delete obj.USER.session_token
    obj.USER.sessionToken = st

    return obj
  }
}

module.exports = {
  path: fileUtil.path,

  defaults () {
    return {
      USER: {},
      PROJECTS: [],
      PROJECT_PREFERENCES: {},
      PROJECTS_CONFIG: {},
    }
  },

  _applyRewriteRules (obj = {}) {
    return _.reduce([convertProjectsToArray, renameSessionToken], (memo, fn) => {
      let ret

      ret = fn(memo)

      if (ret) {
        return ret
      }

      return memo
    }
    , _.cloneDeep(obj))
  },

  read () {
    return fileUtil.get().then((contents) => {
      return _.defaults(contents, this.defaults())
    })
  },

  write (obj = {}) {
    return fileUtil.set(obj).return(obj)
  },

  _getProjects (tx) {
    return tx.get('PROJECTS', [])
  },

  _removeProjects (tx, projects, paths) {
    // normalize paths in array
    projects = _.without(projects, ...[].concat(paths))

    return tx.set({ PROJECTS: projects })
  },

  /**
   * @return {Promise<string[]>}
   */
  getProjectRoots () {
    return fileUtil.transaction((tx) => {
      return this._getProjects(tx).then((projects) => {
        const pathsToRemove = Promise.reduce(projects, (memo, path) => {
          return fs.statAsync(path)
          .catch(() => {
            return memo.push(path)
          }).return(memo)
        }
        , [])

        return pathsToRemove.then((removedPaths) => {
          return this._removeProjects(tx, projects, removedPaths)
        }).then(() => {
          return this._getProjects(tx)
        })
      })
    })
  },

  removeProject (path) {
    return fileUtil.transaction((tx) => {
      return this._getProjects(tx).then((projects) => {
        return this._removeProjects(tx, projects, path)
      })
    })
  },

  insertProject (path) {
    return fileUtil.transaction((tx) => {
      return this._getProjects(tx).then((projects) => {
        // projects are sorted by most recently used, so add a project to
        // the start or move it to the start if it already exists
        const existingIndex = _.findIndex(projects, (project) => {
          return project === path
        })

        if (existingIndex > -1) {
          projects.splice(existingIndex, 1)
        }

        projects.unshift(path)

        return tx.set('PROJECTS', projects)
      })
    })
  },

  getUser () {
    return fileUtil.get('USER', {})
  },

  setUser (user) {
    return fileUtil.set({ USER: user })
  },

  removeUser () {
    return fileUtil.set({ USER: {} })
  },

  removeLatestProjects () {
    return fileUtil.set({ PROJECTS: [] })
  },

  getProjectPreferences () {
    return fileUtil.get('PROJECT_PREFERENCES', {})
  },

  insertProjectPreferences (projectTitle, projectPreferences) {
    return fileUtil.transaction((tx) => {
      return tx.get('PROJECT_PREFERENCES', {}).then((preferences) => {
        return tx.set('PROJECT_PREFERENCES', {
          ...preferences,
          [projectTitle]: {
            ...preferences[projectTitle],
            ...projectPreferences,
          },
        })
      })
    })
  },

  removeAllProjectPreferences () {
    return fileUtil.set({ PROJECT_PREFERENCES: {} })
  },

  removeProjectPreferences (projectTitle) {
    const preferences = fileUtil.get('PROJECT_PREFERENCES', {})

    const updatedPreferences = {
      ...preferences.PROJECT_PREFERENCES,
      [projectTitle]: null,
    }

    return fileUtil.set({ PROJECT_PREFERENCES: updatedPreferences })
  },

  remove () {
    return fileUtil.remove()
  },

  // for testing purposes

  __get: fileUtil.get.bind(fileUtil),
}
