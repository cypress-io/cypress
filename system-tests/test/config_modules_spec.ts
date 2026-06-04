import systemTests from '../lib/system-tests'

// All projects live inside of projects/config-cjs-and-esm
describe('cypress config with esm and cjs', function () {
  systemTests.setup()

  ;[
    'config-cjs-and-esm/config-with-mjs',
    'config-cjs-and-esm/config-with-cjs',
    'config-cjs-and-esm/config-with-js-module',
    'config-cjs-and-esm/config-with-ts-module',
    'config-cjs-and-esm/config-node-next',
    // covers use cases that now work with tsx
    'config-cjs-and-esm/config-with-ts-extends',
    'config-cjs-and-esm/config-with-ts-module-no-tsconfig',
    // This covers Vite and SvelteKit e2e projects
    'config-cjs-and-esm/config-with-ts-module-and-esbuild',
    'config-cjs-and-esm/config-with-ts-tsconfig-es2015',
  ].forEach((project) => {
    systemTests.it(`supports modules and cjs in ${project}`, {
      project,
      testingType: 'e2e',
      spec: 'app.cy.js',
      browser: 'chrome',
      expectedExitCode: 0,
    })
  })

  systemTests.it('supports modules and cjs in component testing', {
    project: 'config-cjs-and-esm/config-with-ts-module-component',
    testingType: 'component',
    spec: 'src/foo.ts',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

describe('compiles config files using the native node import', () => {
  systemTests.setup()

  ;[
    // esbuild chokes on these kinds of projects (JS Config File + TSConfig that's out of range)
    // so this makes sure we're using the native node import
    'config-cjs-and-esm/config-with-mjs-tsconfig-es2015',
    'config-cjs-and-esm/config-with-cjs-tsconfig-es2015',
    'config-cjs-and-esm/config-with-js-tsconfig-es2015',
    'config-cjs-and-esm/config-with-module-resolution-bundler',
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
