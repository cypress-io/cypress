import systemTests from '../lib/system-tests'
import { beforePrePullImages } from '../lib/docker'

const IMAGES = [
  'cypress/base:22.0.0',
  'cypress/base:22.7.0',
  'cypress/base:22.12.0',
  'cypress/base:22.19.0',
]

beforePrePullImages(IMAGES)

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
  IMAGES.forEach(smokeTestDockerImage)
})

describe('type: module', () => {
  IMAGES.forEach((dockerImage) => {
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
