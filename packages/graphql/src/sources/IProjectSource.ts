import type { Project } from '../entities/Project'

export interface IProjectSource {
  localProjects: Project[]
  activeProject: Project | null
  loadProjects(): Promise<Project[]>
}
