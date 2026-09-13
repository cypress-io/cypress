// Cypress adds chai expect and assert to global

// In an ambient global declaration only `var` lands on `typeof globalThis`,
// which is what makes `window.expect` and `globalThis.assert` resolve.
// eslint-disable-next-line no-var
declare var expect: Chai.ExpectStatic
// eslint-disable-next-line no-var
declare var assert: Chai.AssertStatic
