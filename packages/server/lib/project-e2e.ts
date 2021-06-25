import { ProjectBase } from './project-base'
import { ServerE2E } from './server-e2e'

export class ProjectE2E extends ProjectBase<ServerE2E> {
  get projectType (): 'e2e' {
    return 'e2e'
  }
}
