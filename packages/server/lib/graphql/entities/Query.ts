import { nxs } from 'nexus-decorators'
import { ProjectBase } from '../../project-base'
import { App } from './App'
import { Project } from './Project'
import { Wizard } from './Wizard'
import openProject from '../../open_project'

export class Query {
  @nxs.queryField(() => {
    return {
      type: nxs.nonNull(App),
    }
  })
  static app () {
    return new App()
  }

  @nxs.queryField(() => {
    return {
      type: Project,
      description: 'The active project for the application, if any',
    }
  })
  static currentProject () {
    const proj = openProject.getProject()

    return proj ? new Project({ path: proj.projectRoot }) : null
  }

  @nxs.queryField(() => {
    return {
      type: nxs.list(Project),
      description: 'All projects we know about on the machine',
    }
  })
  static async recentProjects () {
    const rows = ProjectBase.getPathsAndIds()

    return rows.map((row) => new Project(row))
  }

  @nxs.queryField({
    type: 'Wizard',
    description: 'Returns metadata associated with the onboarding wizard',
  })
  static wizard () {
    return new Wizard()
  }
}
