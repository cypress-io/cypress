import type { Mutation, Project } from '../generated/test-graphql-types.gen'
import path from 'path'

import type { MaybeResolver } from './clientTestUtils'

export const stubMutation: MaybeResolver<Mutation> = {
  __typename: 'Mutation',
  addProject (source, args, ctx) {
    const project: Project = {
      id: `project:${args.path}`,
      title: path.basename(args.path),
      projectRoot: args.path,
      isFirstTimeCT: true,
      isFirstTimeE2E: true,
      __typename: 'Project',
    }

    ctx.app.projects.push(project)

    return ctx.app
  },
  setActiveProject (source, args, ctx) {
    ctx.app.activeProject = ctx.app.projects.find((p) => p.projectRoot === args.path) ?? null

    return {}
  },
  appCreateConfigFile: (source, args, ctx) => {
    ctx.wizard.chosenManualInstall = true
    ctx.wizard.canNavigateForward = true

    return ctx.app
  },
  clearActiveProject (source, args, ctx) {
    ctx.app.activeProject = null

    return {}
  },
  removeProject (source, args, ctx) {
    ctx.app.projects = ctx.app.projects.filter((p) => p.projectRoot !== args.path)

    return ctx.app
  },
  generateSpecFromStory (source, args, ctx) {
    return ctx.wizard
  },
}
