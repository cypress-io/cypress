/* eslint-disable no-redeclare */
import _ from 'lodash'
import { nxs } from 'nexus-decorators'

import { DataContext } from '../util/DataContext'
import { proxyEntity } from '../util/proxyEntity'
import { Browser, BrowserState } from './Browser'
import { File } from './File'
import { Node } from './Node'

export interface ProjectConfigShape {
  id?: string | undefined
  name?: string
  path: string
}

export const ProjectType = nxs.enumType('ProjectType', ['e2e', 'component'])

// b/c of proxy
export interface Project extends Omit<ProjectConfigShape, 'id'> {}

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
  constructor (readonly data: ProjectConfigShape) {
    super()

    return proxyEntity(this)
  }

  @nxs.field.type(() => ProjectType)
  get type (): string {
    throw new Error('Must be implemented in a child')
  }

  get _id () {
    return this.data.path
  }

  /**
   * The projectId for the project, if any
   */
  projectId () {}

  @nxs.field.type(() => BrowserState)
  browserState () {
    return 'closed'
  }

  @nxs.field.nonNull.string()
  relativePath (args, ctx: DataContext) {
    return ctx.relative(this.absolutePath)
  }

  @nxs.field.nonNull.string()
  get absolutePath () {
    return this.data.path
  }

  @nxs.field.string()
  displayName () {
    if (this.name) return this.name

    // need normalize windows paths with \ before split
    const normalizedPath = this.path.replace(/\\/g, '/')
    const lastDir = _.last(normalizedPath.split('/'))

    return _.truncate(lastDir, { length: 60 })
  }

  @nxs.field.string()
  displayPath (args, ctx) {
    const maxPathLength = 45

    if (this.absolutePath.length <= maxPathLength) return this.absolutePath

    const truncatedPath = this.absolutePath.slice((this.absolutePath.length - 1) - maxPathLength, this.absolutePath.length)

    return '...'.concat(truncatedPath)
  }

  @nxs.field.list.type(() => File)
  sortedSpecsList () {
    return []
  }

  @nxs.field.list.type(() => Browser)
  browsers () {
    return []
  }
}
