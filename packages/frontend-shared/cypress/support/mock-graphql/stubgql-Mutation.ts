import type { Mutation, Project } from '../generated/test-graphql-types.gen'
import config from '../../fixtures/config.json'
import path from 'path'

import type { MaybeResolver } from './clientTestUtils'

export const stubMutation: MaybeResolver<Mutation> = {
  __typename: 'Mutation',
  addProject (source, args, ctx) {
    const project: Project = {
      id: `project:${args.path}`,
      title: path.basename(args.path),
      projectRoot: args.path,
      isCTConfigured: true,
      isE2EConfigured: true,
      __typename: 'Project',
      config,
      codeGenGlob: '/**/*.vue',
    }

    ctx.app.projects.push(project)

    return true
  },
  setActiveProject (source, args, ctx) {
    ctx.app.activeProject = ctx.app.projects.find((p) => p.projectRoot === args.path) ?? null

    return true
  },
  appCreateConfigFile: (source, args, ctx) => {
    ctx.wizard.chosenManualInstall = true
    ctx.wizard.canNavigateForward = true

    return true
  },
  clearActiveProject (source, args, ctx) {
    ctx.app.activeProject = null

    return true
  },
  removeProject (source, args, ctx) {
    ctx.app.projects = ctx.app.projects.filter((p) => p.projectRoot !== args.path)

    return true
  },
  setCurrentSpec (source, args, ctx) {
    if (!ctx.app.activeProject) {
      throw Error('Cannot set currentSpec without active project')
    }

    ctx.app.activeProject.currentSpec = {
      id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
      __typename: 'Spec',
      absolute: '/Users/lachlan/code/work/cypress5/packages/app/src/Basic.spec.tsx',
      relative: 'app/src/Basic.spec.tsx',
      specFileExtension: '.spec.tsx',
      specType: 'component',
      name: 'Basic',
      fileExtension: 'spec.tsx',
      fileName: 'Basic.spec.tsx',
      baseName: 'Basic',
    }

    return true
  },
  hideBrowserWindow (source, args, ctx) {
    return true
  },
  setProjectPreferences (source, args, ctx) {
    return ctx.app
  },
  codeGenSpec (source, args, ctx) {
    if (!ctx.app.activeProject) {
      throw Error('Cannot set currentSpec without active project')
    }

    ctx.app.activeProject.generatedSpec = {
      __typename: 'GeneratedSpec',
      spec: {
        __typename: 'FileParts',
        id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
        absolute: '/Users/lachlan/code/work/cypress5/packages/app/src/Basic.spec.tsx',
        relative: 'app/src/Basic.spec.tsx',
        name: 'Basic',
        fileName: 'Basic.spec.tsx',
        baseName: 'Basic',
      },
      content: `it('should do stuff', () => {})`,
      id: 'U3BlYzovVXNlcnMvbGFjaGxhbi9jb2RlL3dvcmsvY3lwcmVzczUvcGFja2FnZXMvYXBwL3NyYy9CYXNpYy5zcGVjLnRzeA==',
    }

    return true
  },
  reconfigureProject (src, args, ctx) {
    return true
  },
  resetWizard (src, args, ctx) {
    return true
  },
}
