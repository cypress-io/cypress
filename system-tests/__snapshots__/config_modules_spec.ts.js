exports['invalid configuration / shows correct error message for ESM only import in CJS environment'] = `
Your configFile is invalid: /foo/bar/.projects/config-cjs-and-esm/ts-cjs-with-invalid-esm-only-import/cypress.config.ts

It threw an error when required, check the stack trace below:

Error [ERR_REQUIRE_ESM]: require() of ES Module /tmp/cy-system-tests-node-modules/config-cjs-and-esm/ts-cjs-with-invalid-esm-only-import/node_modules/find-up/index.js from /foo/bar/.projects/config-cjs-and-esm/ts-cjs-with-invalid-esm-only-import/cypress.config.ts not supported.
Instead change the require of index.js in /foo/bar/.projects/config-cjs-and-esm/ts-cjs-with-invalid-esm-only-import/cypress.config.ts to a dynamic import() which is available in all CommonJS modules.
      [stack trace lines]
`
