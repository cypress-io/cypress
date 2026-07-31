import systemTests from '../lib/system-tests'
import { beforePrePullImages } from '../lib/docker'

const IMAGE = 'cypress/base:24.0.0'

beforePrePullImages([IMAGE])

// dev-mode runs resolve @babel/preset-typescript from the monorepo, so binary
// packaging problems only reproduce against the built binary
describe('typescript 7', () => {
  systemTests.it(`can run a typescript 7 project in ${IMAGE}`, {
    withBinary: true,
    browser: 'electron',
    dockerImage: IMAGE,
    project: 'ts-proj-7',
  })
})
