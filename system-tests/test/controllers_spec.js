const fs = require('fs-extra')
const path = require('path')

const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

describe('e2e plugins', () => {
  systemTests.setup()

  it('fails when spec does not exist', function () {
    return systemTests.exec(this, {
      spec: 'spec.js',
      project: 'non-existent-spec',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('handles specs with $, &, and + in file name', function () {
    const relativeSpecPath = path.join('dir&1%', '%dir2&', 's%p+ec&.js')
    const e2eProject = Fixtures.projectPath('e2e')
    const specPath = path.join(e2eProject, 'cypress', 'integration', relativeSpecPath)

    return fs.outputFile(specPath, 'it(\'passes\', () => {})')
    .then(() => {
      return systemTests.exec(this, {
        spec: specPath,
        sanitizeScreenshotDimensions: true,
      })
    }).then(({ stdout }) => {
      expect(stdout).to.include(`1 found (${relativeSpecPath})`)
      expect(stdout).to.include(`Running:  ${relativeSpecPath}`)

      expect(stdout).to.include(`Finished processing: /XXX/XXX/XXX/cypress/videos/${relativeSpecPath}.mp4`)
    })
  })
})
