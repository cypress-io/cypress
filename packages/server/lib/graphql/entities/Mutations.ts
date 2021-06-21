import { nxs, NxsMutationArgs } from 'nexus-decorators'
import { openExternal } from '../../gui/links'
import { DataContext } from '../util/DataContext'
import { App } from './App'
import openProject from '../../open_project'

export class Mutations {
  @nxs.mutationField({
    type: 'Boolean',
    args (t) {
      t.nonNull.string('url')
      t.arg('params', { type: 'JSON', default: '{}' })
    },
  })
  static externalOpen (args: NxsMutationArgs<'externalOpen'>) {
    openExternal(args)

    return true
  }

  @nxs.mutationField({
    type: 'Query',
  })
  static closeBrowser () {
    //
  }

  static openFile () {}

  static openFinder () {
    //
  }

  static pingApiServer () {}

  @nxs.mutationField(() => {
    return {
      description: 'Removes a local project from the recentProjects list',
      type: App,
      args (t) {
        t.nonNull.id('id', { description: 'The ID of the project we are removing' })
      },
    }
  })
  static removeProject () {
    return new App()
  }

  static requestAccess () {}

  static setupDashboardProject () {}

  @nxs.mutationField({
    type: 'Query',
    description: 'When we select the active project',
    args (t) {
      t.nonNull.id('id')
    },
  })
  static selectProject (args: NxsMutationArgs<'selectProject'>, ctx: DataContext) {
    const fullPath = ctx.unwrapNodeId(args.id, 'Project')

    openProject.create(fullPath)
  }

  static updaterCheck () {}

  static updaterRun () {}

  static windowOpen () {}

  static windowClose () {}

  @nxs.mutationField({
    type: 'Query',
    description: 'When we add a project, either by dragging or selecting. Adds the project & selects it',
  })
  static addProject (args, ctx) {
    console.log(ctx.options)
  }

  @nxs.mutationField({
    type: 'Query',
  })
  static closeProject () { }

  @nxs.mutationField(() => {
    return {
      type: 'ProjectConfig',
    }
  })
  static setScaffoldPaths () {}
}
