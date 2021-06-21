import { nxs } from 'nexus-decorators'
import { Browser, BrowserState } from './Browser'
import { File } from './File'
import { Node } from './Node'

export interface ProjectConfig {
  path: string
  id?: string | undefined
}

@nxs.objectType({
  description: 'A project is a directory with a cypress.json file',
  definition (t) {
    t.string('name')
    t.string('integrationFolder', {
      description: 'Folder containing the integration tests',
    })

    t.field('organization', {
      type: 'Organization',
    })
  },
})
export class Project extends Node {
  constructor (private config: ProjectConfig) {
    super()
  }

  get _id () {
    return this.config.path
  }

  @nxs.field.type(() => BrowserState)
  browserState () {
    return 'closed'
  }

  @nxs.field.nonNull.string()
  relativePath () {
    return 'unknown'
  }

  @nxs.field.nonNull.string()
  absolutePath () {
    return this.config.path
  }

  @nxs.field.string()
  displayName () {
    return 'proj'
  }

  @nxs.field.string()
  displayPath () {
    return this.config.path
  }

  @nxs.field.list.type(() => File)
  sortedSpecsList () {
  }

  @nxs.field.list.type(() => Browser)
  browsers () {
    return []
  }
}
