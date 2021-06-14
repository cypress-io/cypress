import { nxs } from 'nexus-decorators'

@nxs.objectType({
  description: 'All configuration for a project',
})
export class ProjectConfig {
  @nxs.mutationField(() => {
    return {
      type: 'ProjectConfig',
    }
  })
  static setScaffoldPaths () {}
}
