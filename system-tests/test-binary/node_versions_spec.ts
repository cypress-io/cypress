import systemTests from '../lib/system-tests'

function smokeTestDockerImage (dockerImage: string) {
  context('e2e', () => {
    systemTests.it(`can run in ${dockerImage}`, {
      withBinary: true,
      browser: 'electron',
      dockerImage,
      spec: 'test1.js',
      specDir: 'tests',
      project: 'todos',
    })
  })

  context('component', () => {
    systemTests.it(`can run in ${dockerImage}`, {
      withBinary: true,
      browser: 'electron',
      dockerImage,
      testingType: 'component',
      project: 'simple-ct',
      spec: 'src/simple_passing_component.cy.js',
    })
  })
}

describe('binary node versions', () => {
  [
    'cypress/base:18.15.0',
    'cypress/base:20.5.0',
  ].forEach(smokeTestDockerImage)
})

describe('type: module', () => {
  [
    'cypress/base:18.6.0',
    'cypress/base:20.5.0',
  ].forEach((dockerImage) => {
    systemTests.it(`can run in ${dockerImage}`, {
      withBinary: true,
      project: 'config-cjs-and-esm/config-with-ts-module',
      dockerImage,
      testingType: 'e2e',
      spec: 'app.cy.js',
      browser: 'electron',
      expectedExitCode: 0,
    })
  })
})
