const fs = require('fs-extra')
const path = require('path')

const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

const nonExistentSpec = Fixtures.projectPath('non-existent-spec')
const e2eProject = Fixtures.projectPath('e2e')

describe('e2e plugins', () => {
  e2e.setup()

  it('fails when spec does not exist', function () {
    return e2e.exec(this, {
      spec: 'spec.js',
      project: nonExistentSpec,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('handles specs with $, &, and + in file name', function () {
    const relativeSpecPath = path.join('dir&1%', '%dir2&', 's%p+ec&.js')
    const specPath = path.join(e2eProject, 'cypress', 'integration', relativeSpecPath)

    return fs.outputFile(specPath, 'it(\'passes\', () => {})')
    .then(() => {
      return e2e.exec(this, {
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
