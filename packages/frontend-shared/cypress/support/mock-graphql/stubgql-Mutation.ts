import type { Mutation } from '../generated/test-graphql-types.gen'
import path from 'path'

import type { MaybeResolver } from './clientTestUtils'
import { createTestCurrentProject, createTestGlobalProject } from './stubgql-Project'

export const stubMutation: MaybeResolver<Mutation> = {
  __typename: 'Mutation',
  addProject (source, args, ctx) {
    ctx.projects.push(createTestGlobalProject(path.basename(args.path)))

    return true
  },
  setActiveProject (source, args, ctx) {
    const project = ctx.projects.find((p) => p.projectRoot === args.path)

    ctx.currentProject = project ? createTestCurrentProject(project.title) : null

    return true
  },
  clearActiveProject (source, args, ctx) {
    ctx.currentProject = null

    return true
  },
  removeProject (source, args, ctx) {
    ctx.projects = ctx.projects.filter((p) => p.projectRoot !== args.path)

    return true
  },
  hideBrowserWindow (source, args, ctx) {
    return true
  },
  setProjectPreferences (source, args, ctx) {
    return {}
  },
  generateSpecFromSource (source, args, ctx) {
    if (!ctx.currentProject) {
      throw Error('Cannot set currentSpec without active project')
    }

    return {
      __typename: 'GeneratedSpec',
      spec: {
        __typename: 'FileParts',
        id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
        absolute: '/Users/lachlan/code/work/cypress5/packages/app/src/Basic.spec.tsx',
        relative: 'app/src/Basic.spec.tsx',
        name: 'Basic',
        fileName: 'Basic.spec.tsx',
        baseName: 'Basic',
        fileExtension: 'tsx',
      },
      content: `it('should do stuff', () => {})`,
      id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
    }
  },
  reconfigureProject (src, args, ctx) {
    return true
  },
  resetWizard (src, args, ctx) {
    return true
  },
  scaffoldIntegration (src, args, ctx) {
    return [{
      __typename: 'CodeGenResultWithFileParts',
      codeGenResult: {
        id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
        __typename: 'CodeGenResult',
        file: '/Users/lachlan/code/work/cypress/packages/app/cypress/integration/basic/todo.cy.js',
        status: 'add',
        type: 'text',
        content: 'it(\'should load todos\', () => {})',
      },
      fileParts: {
        id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
        __typename: 'FileParts',
        absolute: '/Users/lachlan/code/work/cypress/packages/app/cypress/integration/basic/todo.cy.js',
        relative: 'cypress/integration/basic/todo.cy.js',
        baseName: 'todo.cy.js',
        name: 'basic/todo.cy.js',
        fileName: 'todo',
        fileExtension: '.js',
      },
    }]
  },
}
