import systemTests, { ItOptions } from '../lib/system-tests'

function smokeTestDockerImage (title: string, dockerImage: string, expectedExitCode: number, onRun?: ItOptions['onRun']) {
  systemTests.it(title, {
    withBinary: true,
    browser: 'electron',
    dockerImage,
    spec: 'test1.js',
    specDir: 'tests',
    project: 'todos',
    expectedExitCode,
    onRun,
  })
}

describe('e2e binary CI environments', () => {
  smokeTestDockerImage(
    'bare node image fails (lacks xvfb)',
    'node:16', 1,
    async (exec) => {
      const { stdout } = await exec()

      expect(stdout).to.include('Your system is missing the dependency: Xvfb')
    },
  )

  // TODO: Where is this image located? Needs to be bumped to Node 16.16.0 or later
  smokeTestDockerImage(
    'bare xvfb image fails',
    'cypressinternal/xvfb:12.13.0', 1,
  )

  smokeTestDockerImage(
    'ubuntu 20 passes',
    'cypress/base-internal:ubuntu20-node16', 0,
  )

  smokeTestDockerImage(
    'ubuntu 22 passes',
    'cypress/base-internal:ubuntu22-node16', 0,
  )
})
