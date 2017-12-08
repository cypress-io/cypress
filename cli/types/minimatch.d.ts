// Shim definition to export a namespace. Cypress is actually a global module
// so import/export isn't allowed there. We import here and define a global module
// so that Cypress can get and use the Blob type
// tslint:disable-next-line:no-implicit-dependencies
import * as mimimatch from 'minimatch'

export = Mimimatch
export as namespace Mimimatch

declare namespace Mimimatch {
  type MimimatchStatic = mimimatch.IMinimatchStatic
}
