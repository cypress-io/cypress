import systemTests from '../lib/system-tests'

// All projects live inside of projects/config-cjs-and-esm
describe('cypress config with esm and cjs', function () {
  systemTests.setup()

  ;[
    'config-cjs-and-esm/config-with-mjs',
    'config-cjs-and-esm/config-with-cjs',
    'config-cjs-and-esm/config-with-js-module',

    // This covers Vite and SvelteKit e2e projects
    'config-cjs-and-esm/config-with-ts-module-and-esbuild',
    'config-cjs-and-esm/config-with-ts-tsconfig-es5',
  ].forEach((project) => {
    systemTests.it(`supports modules and cjs in ${project}`, {
      project,
      testingType: 'e2e',
      spec: 'app.cy.js',
      browser: 'chrome',
      expectedExitCode: 0,
    })
  })

  // TODO: add support for ts-node/esm https://github.com/cypress-io/cypress/issues/21939
  ;[
    'config-cjs-and-esm/config-with-ts-module',
  ].forEach((project) => {
    systemTests.it(`does not support modules and ts without esbuild in ${project}`, {
      project,
      testingType: 'e2e',
      spec: 'app.cy.js',
      browser: 'chrome',
      expectedExitCode: 1,
      snapshot: true,
      onStdout (stdout) {
        expect(stdout).to.include('nearest parent package.json contains "type": "module" which defines all .ts files in that package scope as ES modules')

        // Need to make this stable b/c of filepaths, and snapshot: true is needed to invoke onStdout
        return 'STDOUT_ERROR_VALIDATED'
      },
    })
  })

  ;[
    'config-cjs-and-esm/config-with-ts-module-component',
  ].forEach((project) => {
    // This covers Vite and SvelteKit component testing projects
    systemTests.it(`supports modules and cjs in ${project}`, {
      project,
      testingType: 'component',
      spec: 'src/app.cy.js',
      browser: 'chrome',
      expectedExitCode: 0,
    })
  })
})

describe('compiles config files using the native node import', () => {
  systemTests.setup()

  ;[
    // esbuild chokes on these kinds of projects (JS Config File + TSConfig that's out of range)
    // so this makes sure we're using the native node import
    'config-cjs-and-esm/config-with-mjs-tsconfig-es5',
    'config-cjs-and-esm/config-with-cjs-tsconfig-es5',
    'config-cjs-and-esm/config-with-js-tsconfig-es5',
    'config-cjs-and-esm/config-with-js-tsconfig-es3',
    'config-cjs-and-esm/config-with-js-tsconfig-es2015',
  ].forEach((project) => {
    systemTests.it(`${project}`, {
      project,
      testingType: 'e2e',
      spec: 'app.cy.js',
      browser: 'chrome',
      expectedExitCode: 0,
    })
  })
})
