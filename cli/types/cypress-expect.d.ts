// Cypress adds chai expect and assert to global.
// `var` is load-bearing in an ambient global script file: only `var` declarations
// land on `typeof globalThis`, so `let`/`const` would drop `window.expect` and
// `globalThis.assert` from the published types.
// eslint-disable-next-line no-var
declare var expect: Chai.ExpectStatic
// eslint-disable-next-line no-var
declare var assert: Chai.AssertStatic
