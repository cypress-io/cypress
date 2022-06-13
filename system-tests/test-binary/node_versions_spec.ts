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
    'cypress/base:12',
    'cypress/base:14',
    'cypress/base:16.13.2',
    'cypress/base:17.3.0',
  ].forEach(smokeTestDockerImage)
})
