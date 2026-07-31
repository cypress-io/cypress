import systemTests from '../lib/system-tests'
import { beforePrePullImages } from '../lib/docker'

const IMAGE = 'cypress/base:24.0.0'

beforePrePullImages([IMAGE])

// TypeScript 7 specs are transpiled with the @babel/preset-typescript bundled inside
// the binary, so this must run against the built binary — dev-mode runs resolve the
// preset from the monorepo and can't catch binary packaging problems.
describe('typescript 7', () => {
  systemTests.it(`can run a typescript 7 project in ${IMAGE}`, {
    withBinary: true,
    browser: 'electron',
    dockerImage: IMAGE,
    project: 'ts-proj-7',
  })
})
