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
    'node:18', 1,
    async (exec) => {
      const { stdout } = await exec()

      expect(stdout).to.include('Your system is missing the dependency: Xvfb')
    },
  )

  smokeTestDockerImage(
    'ubuntu 22 passes',
    'cypress/base-internal:ubuntu22-node18', 0,
  )

  smokeTestDockerImage(
    'ubuntu 24 passes',
    'cypress/base-internal:ubuntu24-node18', 0,
  )
})
