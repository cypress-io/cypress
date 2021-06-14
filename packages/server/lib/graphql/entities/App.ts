import { nxs } from 'nexus-decorators'
import { DataContext } from '../util/DataContext'
import { AppOptions } from './AppOptions'
import { Project } from './Project'

@nxs.objectType({
  definition (t) {
    t.string('name', {
      description: 'This is an app with a name',
    })
  },
})
export class App {
  @nxs.queryField(() => {
    return {
      type: 'App',
    }
  })
  static app () {
    return {}
  }

  @nxs.field.list.type(() => Project)
  recentProjects (args, ctx: DataContext) {
    return []
  }

  organizations (args, ctx: DataContext) {
    //
  }

  @nxs.field.type(() => AppOptions)
  options (args, ctx: DataContext) {
    return new AppOptions(ctx.options)
  }

  @nxs.mutationField({
    type: 'Boolean',
  })
  static externalOpen () {
    return true
  }

  // @computed get displayVersion () {
  //   return this.isDev ? `${updateStore.version} (dev)` : updateStore.version
  // }

  // @computed get isDev () {
  //   return this.cypressEnv === 'development'
  // }

  // @computed get isGlobalMode () {
  //   return !this.projectRoot
  // }
}
