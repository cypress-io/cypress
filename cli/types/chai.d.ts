// Shim definition to export a namespace. Cypress is actually a global module
// so import/export isn't allowed there. We import here and define a global module
// so that Cypress can get and use the Blob type
// tslint:disable-next-line:no-implicit-dependencies
import * as chai from 'chai'

export = Chai
export as namespace Chai

declare namespace Chai {
  type ChaiStatic = typeof chai
  type ExpectStatic = typeof chai.expect
  type AssertStatic = typeof chai.assert
}
