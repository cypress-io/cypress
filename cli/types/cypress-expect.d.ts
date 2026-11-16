// Cypress adds chai expect and assert to global

// Only `var` lands on `typeof globalThis` in an ambient global declaration,
// which is what keeps `expect` and `assert` reachable on `window` and `globalThis`.
// eslint-disable-next-line no-var
declare var expect: Chai.ExpectStatic
// eslint-disable-next-line no-var
declare var assert: Chai.AssertStatic
