import type { App, Mutation, Project } from '../generated/test-graphql-types.gen'
import type { GraphQLResolveInfo } from 'graphql'
import path from 'path'

import { stubApp } from './testApp'
import type { ClientTestContext } from '..'
import { stubQuery } from './testQuery'

type MaybeResolver<T> = {
  [K in keyof T]: K extends 'id' | '__typename' ? T[K] : T[K] | ((source: unknown, args: any, ctx: ClientTestContext, info: GraphQLResolveInfo) => MaybeResolver<T[K]>)
}

export const stubMutation: MaybeResolver<Mutation> = {
  __typename: 'Mutation',
  addProject (source, args, ctx): App {
    const project: Project = {
      id: `project:${args.path}`,
      title: path.basename(args.path),
      projectRoot: args.path,
      isFirstTimeCT: true,
      isFirstTimeE2E: true,
      __typename: 'Project',
    }

    ctx.stubApp.projects = [...ctx.stubApp.projects, project]

    return ctx.stubApp
  },
  setActiveProject (source, args) {
    return stubApp
  },
  clearActiveProject () {
    return stubQuery
  },
}
