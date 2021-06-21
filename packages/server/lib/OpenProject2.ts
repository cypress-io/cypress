import { ProjectCt } from '@packages/server-ct'
import { ProjectE2E } from './project-e2e'

export class ActiveProjectManager {
  private _activeProject: ActiveProject | null = null

  get activeProject (): ActiveProject | null {
    return this._activeProject
  }
}

export class ActiveProject {
  private _project: ProjectCt | ProjectE2E

  //
}
