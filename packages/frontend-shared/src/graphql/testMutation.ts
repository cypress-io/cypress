import type { App, Mutation, Project } from '../generated/test-graphql-types.gen'
import type { GraphQLResolveInfo } from 'graphql'

import { stubApp } from './testApp'

type MaybeResolver<T> = {
  [K in keyof T]: K extends 'id' | '__typename' ? T[K] : T[K] | ((args: any, ctx: object, info: GraphQLResolveInfo) => MaybeResolver<T[K]>)
}

export const stubMutation: MaybeResolver<Mutation> = {
  __typename: 'Mutation',
  addProject (path: string): App {
    const project: Project = {
      id: '1',
      title: 'Project',
      projectRoot: path,
      isFirstTimeCT: true,
      isFirstTimeE2E: true,
      __typename: 'Project',
    }

    const updatedApp: App = {
      ...stubApp,
      projects: [...stubApp.projects, project],
    }

    return updatedApp
  },
  setActiveProject (path: string) {
    return stubApp
  },
}
