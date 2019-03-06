// Shim definition to export a namespace. Cypress is actually a global module
// so import/export isn't allowed there. We import here and define a global module
/// <reference path="./chai/index.d.ts" />

export = Chai
export as namespace Chai

declare namespace Chai {
  type ChaiStatic = typeof chai
  type ExpectStatic = typeof chai.expect
  type AssertStatic = typeof chai.assert
}
