import { ProjectBase } from '@packages/server/lib/project-base'
import { ServerCt } from './server-ct'

export * from '@packages/server/lib/project-base'

export class ProjectCt extends ProjectBase<ServerCt> {
  get projectType (): 'ct' {
    return 'ct'
  }
}
