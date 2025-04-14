import _ from 'lodash'
import Promise from 'bluebird'
import { globalPubSub } from '@packages/data-context'
import { fs } from './util/fs'
import appData from './util/app_data'
import FileUtil from './util/file'
import type { Cache, CachedUser, Preferences, Cohort } from '@packages/types'

interface Transaction {
  get: <T = Cache>(key?: string, defaultValue?: T) => Promise<T>
  set: (key: string | Partial<Cache>, value?: any) => Promise<void>
}

const fileUtil = new FileUtil({
  path: appData.path('cache'),
})

globalPubSub.on('test:cleanup', () => {
  fileUtil.__resetForTest()
})

export const cache = {
  path: fileUtil.path,

  defaults (): Cache {
    return {
      USER: {
        authToken: '',
        name: '',
        email: '',
      },
      PROJECTS: [],
      PROJECT_PREFERENCES: {},
      PROJECTS_CONFIG: {},
      COHORTS: {},
    }
  },

  _read (): Promise<Cache> {
    return fileUtil.get().then((contents) => {
      return _.defaults(contents, this.defaults())
    })
  },

  _getProjects (tx: Transaction): Promise<string[]> {
    return tx.get('PROJECTS', [])
  },

  _removeProjects (tx: Transaction, projects: string[], paths: string | string[]): Promise<void> {
    const pathsArray = Array.isArray(paths) ? paths : [paths]

    projects = _.without(projects, ...pathsArray)

    return tx.set({ PROJECTS: projects })
  },

  getProjectRoots (): Promise<string[]> {
    return fileUtil.transaction((tx: Transaction) => {
      return this._getProjects(tx).then((projects) => {
        const pathsToRemove = Promise.reduce(projects, (memo: string[], path) => {
          return fs.statAsync(path)
          .catch(() => {
            memo.push(path)

            return memo
          }).return(memo)
        }, [])

        return pathsToRemove.then((removedPaths) => {
          return this._removeProjects(tx, projects, removedPaths)
        }).then(() => {
          return this._getProjects(tx)
        })
      })
    })
  },

  removeProject (path: string): Promise<void> {
    return fileUtil.transaction((tx: Transaction) => {
      return this._getProjects(tx).then((projects) => {
        return this._removeProjects(tx, projects, path)
      })
    })
  },

  insertProject (path: string): Promise<void> {
    return fileUtil.transaction((tx: Transaction) => {
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

  getUser (): Promise<CachedUser> {
    return fileUtil.get('USER', {})
  },

  setUser (user: CachedUser): Promise<void> {
    return fileUtil.set({ USER: user })
  },

  removeUser (): Promise<void> {
    return fileUtil.set({ USER: {} })
  },

  removeLatestProjects (): Promise<void> {
    return fileUtil.set({ PROJECTS: [] })
  },

  getProjectPreferences (): Promise<Record<string, Preferences>> {
    return fileUtil.get('PROJECT_PREFERENCES', {})
  },

  insertProjectPreferences (projectTitle: string, projectPreferences: Preferences): Promise<void> {
    return fileUtil.transaction((tx: Transaction) => {
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

  removeAllProjectPreferences (): Promise<void> {
    return fileUtil.set({ PROJECT_PREFERENCES: {} })
  },

  removeProjectPreferences (projectTitle: string): Promise<void> {
    const preferences = fileUtil.get('PROJECT_PREFERENCES', {})

    const updatedPreferences = {
      ...preferences.PROJECT_PREFERENCES,
      [projectTitle]: null,
    }

    return fileUtil.set({ PROJECT_PREFERENCES: updatedPreferences })
  },

  getCohorts (): Promise<Record<string, Cohort>> {
    return fileUtil.get('COHORTS', {}).then((cohorts) => {
      Object.keys(cohorts).forEach((key) => {
        cohorts[key].name = key
      })

      return cohorts
    })
  },

  insertCohort (cohort: Cohort): Promise<void> {
    return fileUtil.transaction((tx: Transaction) => {
      return tx.get('COHORTS', {}).then((cohorts) => {
        return tx.set('COHORTS', {
          ...cohorts,
          [cohort.name]: {
            cohort: cohort.cohort,
          },
        })
      })
    })
  },

  remove (): Promise<void> {
    return fileUtil.remove()
  },

  // for testing purposes
  __get: fileUtil.get.bind(fileUtil) as <T = Cache>(key?: string, defaultValue?: T) => Promise<T>,
}
