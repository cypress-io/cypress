import { getBrowsers } from './browsers'
import { ProjectBase, Server } from './project-base'

interface OpenProject {
  isOpen: boolean
  project: ProjectBase<Server>
}

export type TestingType = 'e2e' | 'component'

interface Args {
  testingType: TestingType
  projectRoot: string
}

class Projects {
  private currentProject?: string
  projects: Record<string, OpenProject> = {}

  async addProject (projectRoot: string, { testingType }: Args) {
    const type = testingType === 'component' ? 'ct' : 'e2e'

    const project = new ProjectBase({
      projectType: type,
      projectRoot,
      options: {
        testingType: type,
      },
    })

    const browsers = await getBrowsers()

    await project.initializeConfig({ browsers })

    this.projects[projectRoot] = {
      project,
      isOpen: true
    }
  }

  setTestingType (testingType: TestingType) {
    this.openProject.projectType = testingType === 'component' ? 'ct' : 'e2e'
  } 

  get openProject () {
    if (!this.currentProject) {
      throw Error('No project open')
    }

    return this.projects[this.currentProject].project
  }
}

export const projects = new Projects()
