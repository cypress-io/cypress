import type { Project } from '../entities/Project'

export interface IProjectActions {
  addProject(projectRoot: string): Project
  setActiveProject(project: Project): Project
}
