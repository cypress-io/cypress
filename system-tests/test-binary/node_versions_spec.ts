import systemTests from '../lib/system-tests'

function smokeTestDockerImage (dockerImage: string) {
  systemTests.it(`can run in ${dockerImage}`, {
    withBinary: true,
    browser: 'electron',
    dockerImage,
    spec: 'test1.js',
    specDir: 'tests',
    project: 'todos',
  })
}

describe('e2e binary node versions', () => {
  [
    'cypress/base:12',
    'cypress/base:14',
    'cypress/base:16.5.0',
    'cypress/base:17.3.0',
  ].forEach(smokeTestDockerImage)
})
