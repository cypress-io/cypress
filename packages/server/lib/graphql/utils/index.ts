// import { projects } from '../../projects'
import type { ProjectBase } from '../../project-base'
import { NexusGenFieldTypes } from '../gen/nxs.gen'

export function formatProject (project: ProjectBase<any>): NexusGenFieldTypes['Project'] {
  return {
    projectRoot: project.projectRoot,
    isOpen: project.isOpen,
    plugins: project.pluginsStatus,
    isCurrent: project.id === projects.currentProjectId,
  }
}
