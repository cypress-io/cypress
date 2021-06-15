import { nxs } from 'nexus-decorators'
import { File } from './File'

@nxs.objectType({
  description: 'A project is a directory with a cypress.json file',
  definition (t) {
    t.string('name')
    t.field('organization', {
      type: 'Organization',
    })
  },
})
export class Project {
  @nxs.queryField(() => ({ type: 'Project' }))
  static currentProject () {
    return {}
  }

  @nxs.queryField(() => {
    return {
      type: nxs.list(Project),
      description: 'All projects we know about on the machine',
    }
  })
  static projects () {
    return []
  }

  @nxs.mutationField({
    type: 'Query',
  })
  static addProject () {
    //
  }

  @nxs.mutationField({
    type: 'Query',
    description: 'Removes a project from the list of projects',
  })
  static removeProject () {}

  @nxs.mutationField({
    type: 'Query',
  })
  static closeProject () { }

  @nxs.field.list.type(() => File)
  sortedSpecsList () {

  }
}
