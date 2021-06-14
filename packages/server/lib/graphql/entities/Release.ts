import { nxs } from 'nexus-decorators'
import { proxyEntity } from '../util/proxyEntity'

interface ReleaseData {

}

@nxs.objectType({
  description: 'A release of the test runner',
})
export class Release {
  constructor (readonly data: ReleaseData) {
    return proxyEntity(this)
  }
}
