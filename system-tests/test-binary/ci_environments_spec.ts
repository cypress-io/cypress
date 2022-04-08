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
    'node:12', 1,
    async (exec) => {
      const { stdout } = await exec()

      expect(stdout).to.include('Your system is missing the dependency: Xvfb')
    },
  )

  smokeTestDockerImage(
    'bare xvfb image fails',
    'cypressinternal/xvfb:12.13.0', 1,
  )

  smokeTestDockerImage(
    'ubuntu 16 passes',
    'cypress/base:ubuntu16-12.13.1', 0,
  )

  smokeTestDockerImage(
    'ubuntu 19 passes',
    'cypress/base:ubuntu19-node12.14.1', 0,
  )
})
