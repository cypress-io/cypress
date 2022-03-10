import systemTests from '../lib/system-tests'

// All projects live inside of projects/config-cjs-and-esm
describe('cypress config with esm and cjs', function () {
  systemTests.setup()

  ;[
    'config-cjs-and-esm/config-with-mjs',
    'config-cjs-and-esm/config-with-cjs',
    'config-cjs-and-esm/config-with-js-module',
    'config-cjs-and-esm/config-with-ts-module',

    // This covers Vite and SvelteKit e2e projects
    'config-cjs-and-esm/config-with-ts-module-and-esbuild',
  ].forEach((project) => {
    systemTests.it(`supports modules and cjs in ${project}`, {
      project,
      testingType: 'e2e',
      spec: 'app.cy.js',
      browser: 'chrome',
      expectedExitCode: 0,
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
