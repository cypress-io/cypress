import { nxs } from 'nexus-decorators'

interface OrganizationData {
  id: string
  name: string
  default: boolean
}

@nxs.objectType({
  definition (t) {
    t.string('name')
  },
})
export class Organization {
  constructor (private data: OrganizationData) {
  }
}
