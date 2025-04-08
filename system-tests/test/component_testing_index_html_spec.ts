import systemTests from '../lib/system-tests'

describe('component testing projects', function () {
  systemTests.setup()

  systemTests.it('vue3-vite-ts-custom-index-html', {
    project: 'vue3-vite-ts-custom-index-html',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})
