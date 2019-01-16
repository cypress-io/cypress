// Shim definition to export a namespace. Cypress is actually a global module
// so import/export isn't allowed there. We import here and define a global module
// so that Cypress can get and use the Moment type
// tslint:disable-next-line:no-implicit-dependencies
import * as moment from 'moment'
export = Moment
export as namespace Moment

declare namespace Moment {
  type MomentStatic = typeof moment
}
