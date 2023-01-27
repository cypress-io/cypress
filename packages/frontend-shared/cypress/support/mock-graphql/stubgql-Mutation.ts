import type { Mutation, RemoteFetchable } from '../generated/test-graphql-types.gen'

import type { MaybeResolver } from './clientTestUtils'
import { createTestCurrentProject, createTestGlobalProject } from './stubgql-Project'

// `path` is externalized, so we use a simple implementation of `path.basename` here
function basename (path: string) {
  return path.split(/[/\\]/).slice(-1)[0]
}

const atob = global.atob ?? function atob (str: string) {
  return Buffer.from(str, 'base64').toString('utf8')
}

export const stubMutation: MaybeResolver<Mutation> = {
  __typename: 'Mutation',
  getReactComponentsFromFile (source, args, ctx) {
    return { components: [
      {
        __typename: 'ReactComponentDescriptor',
        exportName: 'FooBar',
        isDefault: false,
      },
      {
        __typename: 'ReactComponentDescriptor',
        exportName: 'BarFoo',
        isDefault: true,
      },
      {
        __typename: 'ReactComponentDescriptor',
        exportName: 'FooBarBaz',
        isDefault: false,
      },
    ],
    errored: false,
    }
  },
  addProject (source, args, ctx) {
    if (!args.path) {
      return {}
    }

    ctx.projects.push(createTestGlobalProject(basename(args.path)))

    return {}
  },
  setCurrentProject (source, args, ctx) {
    const project = ctx.projects.find((p) => p.projectRoot === args.path)

    ctx.currentProject = project ? createTestCurrentProject(project.title) : null

    return {}
  },
  clearCurrentProject (source, args, ctx) {
    ctx.currentProject = null

    return {}
  },
  removeProject (source, args, ctx) {
    ctx.projects = ctx.projects.filter((p) => p.projectRoot !== args.path)

    return {}
  },
  resetLatestVersionTelemetry () {
    return true
  },
  focusActiveBrowserWindow (source, args, ctx) {
    return true
  },
  resetAuthState (source, args, ctx) {
    ctx.authState = { browserOpened: false }

    return { }
  },
  setProjectPreferencesInGlobalCache (source, args, ctx) {
    return {}
  },
  generateSpecFromSource (source, args, ctx) {
    if (!ctx.currentProject) {
      throw Error('Cannot set currentSpec without active project')
    }

    return {
      currentProject: ctx.currentProject,
      generatedSpecResult: {
        __typename: 'ScaffoldedFile',
        status: 'valid',
        description: 'Generated Spec',
        file: {
          __typename: 'FileParts',
          id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
          absolute: '/Users/lachlan/code/work/cypress5/packages/app/src/Basic.spec.tsx',
          relative: 'app/src/Basic.spec.tsx',
          name: 'Basic',
          fileName: 'Basic.spec.tsx',
          baseName: 'Basic',
          fileExtension: 'tsx',
          contents: `it('should do stuff', () => {})`,
        },
      },

    }
  },
  reconfigureProject (src, args, ctx) {
    return true
  },
  resetWizard (src, args, ctx) {
    return true
  },
  e2eExamples (src, args, ctx) {
    return [{
      __typename: 'ScaffoldedFile',
      status: 'valid',
      description: 'Generated spec',
      file: {
        id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
        __typename: 'FileParts',
        absolute: '/Users/lachlan/code/work/cypress/packages/app/cypress/integration/basic/todo.cy.js',
        relative: 'cypress/integration/basic/todo.cy.js',
        baseName: 'todo.cy.js',
        name: 'basic/todo.cy.js',
        fileName: 'todo',
        fileExtension: '.js',
        contents: `
          describe('Todo Spec', () => {
            it('adds a todo', () => {
              // TODO
            })
          })`,
      },
    }]
  },
  matchesSpecPattern (src, args, ctx) {
    return true
  },
  closeBrowser (src, args, ctx) {
    return true
  },
  switchTestingTypeAndRelaunch (src, args, ctx) {
    return true
  },
  setPreferences (src, args, ctx) {
    ctx.localSettings.preferences.isSideNavigationOpen = true

    return {}
  },
  loadRemoteFetchables (source, args, ctx) {
    return args.ids.map((id) => {
      const [__typename, hash] = atob(id).split(':')

      const rf: RemoteFetchable & {__typename: string} = {
        id,
        fetchingStatus: 'FETCHING',
        operation: '',
        operationHash: hash,
        operationVariables: {},
        __typename,
      }

      return rf
    })
  },
}
