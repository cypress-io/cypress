import browsers from './browsers'
import { ProjectBase, Server } from './project-base'

export type TestingType = 'e2e' | 'component'

interface Args {
  projectRoot: string
  testingType: TestingType
}

class Projects {
  private currentProject?: string
  // key is projectRoot
  projects: Record<string, ProjectBase<Server>> = {}

  async addProject ({ testingType, projectRoot }: Args, { isCurrentProject }: { isCurrentProject: boolean }) {
    const type = testingType === 'component' ? 'ct' : 'e2e'

    const projectBase = new ProjectBase({
      projectType: type,
      projectRoot,
      options: {
        projectRoot,
        testingType: type,
      },
    })

    const allBrowsers = await browsers.getAllBrowsersWith()

    await projectBase.initializeConfig({ browsers: allBrowsers })

    this.projects[projectRoot] = projectBase

    if (isCurrentProject) {
      this.currentProject = projectRoot
    }

    return this.projects[projectRoot]
  }

  setTestingType (testingType: TestingType) {
    this.openProject.projectType = testingType === 'component' ? 'ct' : 'e2e'
  }

  async initializePlugins () {
    const project = this.openProject

    if (project.pluginsStatus.state === 'initialized') {
      // Do we need to initialize *again*?
      // Consider a `reinitialize` argument to facilitate this.
      return
    }

    try {
      project.pluginsStatus = { state: 'initializing' }
      const updatedConfig = await project.initializePlugins(
        project.getConfig(),
        project.options,
      )

      project.__setConfig(updatedConfig)
      project.pluginsStatus = { state: 'initialized' }
    } catch (e) {
      project.pluginsStatus = {
        state: 'error',
        message: e.details,
      }
    }
  }

  get openProject () {
    if (!this.currentProject) {
      throw Error('No project open')
    }

    return this.projects[this.currentProject]
  }
}

export const projects = new Projects()
