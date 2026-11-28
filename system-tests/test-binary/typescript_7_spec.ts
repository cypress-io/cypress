import systemTests from '../lib/system-tests'
import { beforePrePullImages } from '../lib/docker'

const IMAGE = 'cypress/base:24.0.0'

beforePrePullImages([IMAGE])

describe('typescript 7', () => {
  systemTests.it(`can run a typescript 7 project in ${IMAGE}`, {
    withBinary: true,
    // cypress/base ships no browser but the bundled Electron
    browser: 'electron',
    dockerImage: IMAGE,
    project: 'ts-proj-7',
  })
})
