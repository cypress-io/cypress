import { nxs } from 'nexus-decorators'
import { proxyEntity } from '../util/proxyEntity'

interface FolderData {

}

@nxs.objectType({
  description: 'A folder',
  definition (t) {
    t.string('displayName')
    t.field('specType', {
      type: nxs.enumType('SpecType', ['integration', 'component']),
    })
  },
})
export class Folder {
  constructor (readonly data: FolderData) {
    return proxyEntity(this)
  }

  @nxs.field.string()
  path () {}

  isExpanded () {}

  children () {}

  @nxs.field.boolean()
  hasChildren () {}
}
